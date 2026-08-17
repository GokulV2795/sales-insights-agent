"""Shared SQL aggregation helpers used by the dashboard, chat tools, and
cumulative report endpoints so all three surfaces stay consistent."""

from datetime import date

from sqlalchemy import Integer, case, func, select
from sqlalchemy.orm import Session

from app.models import Category, Customer, Product, Region, SalesOrder, Store


def _date_filters(start_date: date | None, end_date: date | None):
    filters = []
    if start_date:
        filters.append(SalesOrder.order_date >= start_date)
    if end_date:
        filters.append(SalesOrder.order_date <= end_date)
    return filters


def get_kpis(db: Session, start_date: date | None = None, end_date: date | None = None) -> dict:
    filters = _date_filters(start_date, end_date)

    completed = select(
        func.coalesce(func.sum(SalesOrder.total_amount), 0.0).label("revenue"),
        func.count(SalesOrder.id).label("orders"),
        func.coalesce(func.sum(SalesOrder.quantity), 0).label("units"),
        func.count(func.distinct(SalesOrder.customer_id)).label("customers"),
    ).where(SalesOrder.status == "Completed", *filters)
    row = db.execute(completed).one()

    total_orders_all = db.execute(
        select(func.count(SalesOrder.id)).where(*filters)
    ).scalar_one()
    refunded = db.execute(
        select(func.count(SalesOrder.id)).where(SalesOrder.status == "Refunded", *filters)
    ).scalar_one()

    refund_rate = (refunded / total_orders_all * 100) if total_orders_all else 0.0
    avg_order_value = (row.revenue / row.orders) if row.orders else 0.0

    deltas = _monthly_kpi_deltas(db, start_date, end_date)

    return {
        "total_revenue": round(row.revenue, 2),
        "total_orders": row.orders,
        "total_units": row.units,
        "avg_order_value": round(avg_order_value, 2),
        "unique_customers": row.customers,
        "refund_rate_pct": round(refund_rate, 2),
        "revenue_mom_growth_pct": deltas["revenue_mom_growth_pct"],
        "orders_mom_growth_pct": deltas["orders_mom_growth_pct"],
        "aov_mom_growth_pct": deltas["aov_mom_growth_pct"],
        "customers_mom_growth_pct": deltas["customers_mom_growth_pct"],
        "refund_rate_mom_delta_pp": deltas["refund_rate_mom_delta_pp"],
    }


def _pct_growth(prev: float, curr: float) -> float:
    if not prev:
        return 0.0
    return (curr - prev) / prev * 100


def _monthly_kpi_deltas(db: Session, start_date: date | None, end_date: date | None) -> dict:
    """Compares the last two calendar months in range across the headline KPIs,
    so each stat tile can show a real month-over-month trend indicator."""
    filters = _date_filters(start_date, end_date)
    period_expr = func.strftime("%Y-%m", SalesOrder.order_date)

    completed_stmt = (
        select(
            period_expr.label("period"),
            func.sum(SalesOrder.total_amount).label("revenue"),
            func.count(SalesOrder.id).label("orders"),
            func.count(func.distinct(SalesOrder.customer_id)).label("customers"),
        )
        .where(SalesOrder.status == "Completed", *filters)
        .group_by(period_expr)
        .order_by(period_expr)
    )
    completed_rows = db.execute(completed_stmt).all()

    total_stmt = (
        select(period_expr.label("period"), func.count(SalesOrder.id).label("total"))
        .where(*filters)
        .group_by(period_expr)
    )
    total_by_period = {r.period: r.total for r in db.execute(total_stmt).all()}

    refunded_stmt = (
        select(period_expr.label("period"), func.count(SalesOrder.id).label("refunded"))
        .where(SalesOrder.status == "Refunded", *filters)
        .group_by(period_expr)
    )
    refunded_by_period = {r.period: r.refunded for r in db.execute(refunded_stmt).all()}

    zeros = {
        "revenue_mom_growth_pct": 0.0,
        "orders_mom_growth_pct": 0.0,
        "aov_mom_growth_pct": 0.0,
        "customers_mom_growth_pct": 0.0,
        "refund_rate_mom_delta_pp": 0.0,
    }
    if len(completed_rows) < 2:
        return zeros

    prev, curr = completed_rows[-2], completed_rows[-1]
    prev_aov = (prev.revenue / prev.orders) if prev.orders else 0.0
    curr_aov = (curr.revenue / curr.orders) if curr.orders else 0.0

    def refund_rate_for(period: str) -> float:
        total = total_by_period.get(period, 0)
        refunded = refunded_by_period.get(period, 0)
        return (refunded / total * 100) if total else 0.0

    return {
        "revenue_mom_growth_pct": round(_pct_growth(prev.revenue, curr.revenue), 2),
        "orders_mom_growth_pct": round(_pct_growth(prev.orders, curr.orders), 2),
        "aov_mom_growth_pct": round(_pct_growth(prev_aov, curr_aov), 2),
        "customers_mom_growth_pct": round(_pct_growth(prev.customers, curr.customers), 2),
        "refund_rate_mom_delta_pp": round(refund_rate_for(curr.period) - refund_rate_for(prev.period), 2),
    }


def get_revenue_trend(db: Session, start_date: date | None = None, end_date: date | None = None) -> list[dict]:
    filters = _date_filters(start_date, end_date)
    period_expr = func.strftime("%Y-%m", SalesOrder.order_date)
    stmt = (
        select(
            period_expr.label("period"),
            func.sum(SalesOrder.total_amount).label("revenue"),
            func.count(SalesOrder.id).label("orders"),
        )
        .where(SalesOrder.status == "Completed", *filters)
        .group_by(period_expr)
        .order_by(period_expr)
    )
    return [
        {"period": r.period, "revenue": round(r.revenue, 2), "orders": r.orders}
        for r in db.execute(stmt).all()
    ]


def get_top_products(
    db: Session, start_date: date | None = None, end_date: date | None = None, limit: int = 10
) -> list[dict]:
    filters = _date_filters(start_date, end_date)
    stmt = (
        select(
            Product.name,
            Category.name.label("category"),
            func.sum(SalesOrder.total_amount).label("revenue"),
            func.sum(SalesOrder.quantity).label("units"),
        )
        .join(Product, SalesOrder.product_id == Product.id)
        .join(Category, Product.category_id == Category.id)
        .where(SalesOrder.status == "Completed", *filters)
        .group_by(Product.id)
        .order_by(func.sum(SalesOrder.total_amount).desc())
        .limit(limit)
    )
    return [
        {"name": r.name, "category": r.category, "revenue": round(r.revenue, 2), "units_sold": r.units}
        for r in db.execute(stmt).all()
    ]


def get_region_breakdown(db: Session, start_date: date | None = None, end_date: date | None = None) -> list[dict]:
    filters = _date_filters(start_date, end_date)
    stmt = (
        select(
            Region.name.label("region"),
            func.sum(SalesOrder.total_amount).label("revenue"),
            func.count(SalesOrder.id).label("orders"),
        )
        .join(Customer, SalesOrder.customer_id == Customer.id)
        .join(Region, Customer.region_id == Region.id)
        .where(SalesOrder.status == "Completed", *filters)
        .group_by(Region.id)
        .order_by(func.sum(SalesOrder.total_amount).desc())
    )
    return [
        {"region": r.region, "revenue": round(r.revenue, 2), "orders": r.orders}
        for r in db.execute(stmt).all()
    ]


def get_category_breakdown(db: Session, start_date: date | None = None, end_date: date | None = None) -> list[dict]:
    filters = _date_filters(start_date, end_date)
    stmt = (
        select(
            Category.name.label("category"),
            func.sum(SalesOrder.total_amount).label("revenue"),
            func.sum(SalesOrder.quantity).label("units"),
        )
        .join(Product, SalesOrder.product_id == Product.id)
        .join(Category, Product.category_id == Category.id)
        .where(SalesOrder.status == "Completed", *filters)
        .group_by(Category.id)
        .order_by(func.sum(SalesOrder.total_amount).desc())
    )
    return [
        {"category": r.category, "revenue": round(r.revenue, 2), "units_sold": r.units}
        for r in db.execute(stmt).all()
    ]


def get_channel_breakdown(db: Session, start_date: date | None = None, end_date: date | None = None) -> list[dict]:
    filters = _date_filters(start_date, end_date)
    stmt = (
        select(
            Store.channel.label("channel"),
            func.sum(SalesOrder.total_amount).label("revenue"),
            func.count(SalesOrder.id).label("orders"),
        )
        .join(Store, SalesOrder.store_id == Store.id)
        .where(SalesOrder.status == "Completed", *filters)
        .group_by(Store.channel)
        .order_by(func.sum(SalesOrder.total_amount).desc())
    )
    return [
        {"channel": r.channel, "revenue": round(r.revenue, 2), "orders": r.orders}
        for r in db.execute(stmt).all()
    ]


def get_cumulative_trend(db: Session, as_of: date) -> list[dict]:
    period_expr = func.strftime("%Y-%m", SalesOrder.order_date)
    stmt = (
        select(
            period_expr.label("period"),
            func.sum(SalesOrder.total_amount).label("revenue"),
            func.count(SalesOrder.id).label("orders"),
            func.sum(SalesOrder.quantity).label("units"),
        )
        .where(SalesOrder.status == "Completed", SalesOrder.order_date <= as_of)
        .group_by(period_expr)
        .order_by(period_expr)
    )
    rows = db.execute(stmt).all()
    cum_revenue = cum_orders = cum_units = 0
    out = []
    for r in rows:
        cum_revenue += r.revenue
        cum_orders += r.orders
        cum_units += r.units or 0
        out.append(
            {
                "period": r.period,
                "cumulative_revenue": round(cum_revenue, 2),
                "cumulative_orders": cum_orders,
                "cumulative_units": cum_units,
            }
        )
    return out


def get_date_bounds(db: Session) -> tuple[date | None, date | None]:
    row = db.execute(select(func.min(SalesOrder.order_date), func.max(SalesOrder.order_date))).one()
    return row[0], row[1]


# --- Product performance ---------------------------------------------------


def get_product_margins(
    db: Session, start_date: date | None = None, end_date: date | None = None, limit: int = 15
) -> list[dict]:
    """Per-product revenue, COGS, gross profit, and margin %, ranked by revenue."""
    filters = _date_filters(start_date, end_date)
    cogs_expr = SalesOrder.quantity * Product.unit_cost
    stmt = (
        select(
            Product.name,
            Category.name.label("category"),
            func.sum(SalesOrder.total_amount).label("revenue"),
            func.sum(SalesOrder.quantity).label("units"),
            func.sum(cogs_expr).label("cogs"),
        )
        .join(Product, SalesOrder.product_id == Product.id)
        .join(Category, Product.category_id == Category.id)
        .where(SalesOrder.status == "Completed", *filters)
        .group_by(Product.id)
        .order_by(func.sum(SalesOrder.total_amount).desc())
        .limit(limit)
    )
    out = []
    for r in db.execute(stmt).all():
        gross_profit = r.revenue - r.cogs
        margin_pct = (gross_profit / r.revenue * 100) if r.revenue else 0.0
        out.append(
            {
                "name": r.name,
                "category": r.category,
                "revenue": round(r.revenue, 2),
                "units_sold": r.units,
                "gross_profit": round(gross_profit, 2),
                "margin_pct": round(margin_pct, 2),
            }
        )
    return out


def get_discount_impact(db: Session, start_date: date | None = None, end_date: date | None = None) -> dict:
    filters = _date_filters(start_date, end_date)
    gross_expr = SalesOrder.quantity * SalesOrder.unit_price
    stmt = select(
        func.coalesce(func.sum(gross_expr), 0.0).label("gross_revenue"),
        func.coalesce(func.sum(SalesOrder.total_amount), 0.0).label("net_revenue"),
        func.coalesce(func.avg(SalesOrder.discount_pct), 0.0).label("avg_discount_pct"),
    ).where(SalesOrder.status == "Completed", *filters)
    row = db.execute(stmt).one()
    discount_given = row.gross_revenue - row.net_revenue
    discount_pct_of_revenue = (discount_given / row.gross_revenue * 100) if row.gross_revenue else 0.0
    return {
        "gross_revenue": round(row.gross_revenue, 2),
        "discount_given": round(discount_given, 2),
        "discount_pct_of_revenue": round(discount_pct_of_revenue, 2),
        "avg_discount_pct": round(row.avg_discount_pct, 2),
    }


# --- Finance -----------------------------------------------------------


def get_finance_summary(db: Session, start_date: date | None = None, end_date: date | None = None) -> dict:
    filters = _date_filters(start_date, end_date)
    cogs_expr = SalesOrder.quantity * Product.unit_cost
    stmt = (
        select(
            func.coalesce(func.sum(SalesOrder.total_amount), 0.0).label("revenue"),
            func.coalesce(func.sum(cogs_expr), 0.0).label("cogs"),
        )
        .join(Product, SalesOrder.product_id == Product.id)
        .where(SalesOrder.status == "Completed", *filters)
    )
    row = db.execute(stmt).one()
    gross_profit = row.revenue - row.cogs
    gross_margin_pct = (gross_profit / row.revenue * 100) if row.revenue else 0.0

    refund_filters = _date_filters(start_date, end_date)
    refunded_revenue = db.execute(
        select(func.coalesce(func.sum(SalesOrder.total_amount), 0.0)).where(
            SalesOrder.status == "Refunded", *refund_filters
        )
    ).scalar_one()

    discount = get_discount_impact(db, start_date, end_date)

    return {
        "revenue": round(row.revenue, 2),
        "cogs": round(row.cogs, 2),
        "gross_profit": round(gross_profit, 2),
        "gross_margin_pct": round(gross_margin_pct, 2),
        "refunded_revenue": round(refunded_revenue, 2),
        "discount_given": discount["discount_given"],
        "discount_pct_of_revenue": discount["discount_pct_of_revenue"],
    }


def get_finance_trend(db: Session, start_date: date | None = None, end_date: date | None = None) -> list[dict]:
    """Monthly revenue, COGS, and gross profit — same $ unit, safe to chart on one axis."""
    filters = _date_filters(start_date, end_date)
    period_expr = func.strftime("%Y-%m", SalesOrder.order_date)
    cogs_expr = SalesOrder.quantity * Product.unit_cost
    stmt = (
        select(
            period_expr.label("period"),
            func.sum(SalesOrder.total_amount).label("revenue"),
            func.sum(cogs_expr).label("cogs"),
        )
        .join(Product, SalesOrder.product_id == Product.id)
        .where(SalesOrder.status == "Completed", *filters)
        .group_by(period_expr)
        .order_by(period_expr)
    )
    out = []
    for r in db.execute(stmt).all():
        gross_profit = r.revenue - r.cogs
        out.append(
            {
                "period": r.period,
                "revenue": round(r.revenue, 2),
                "cogs": round(r.cogs, 2),
                "gross_profit": round(gross_profit, 2),
            }
        )
    return out


# --- RevOps --------------------------------------------------------------


def get_new_customers_trend(db: Session, start_date: date | None = None, end_date: date | None = None) -> list[dict]:
    filters = []
    if start_date:
        filters.append(Customer.signup_date >= start_date)
    if end_date:
        filters.append(Customer.signup_date <= end_date)
    period_expr = func.strftime("%Y-%m", Customer.signup_date)
    stmt = (
        select(period_expr.label("period"), func.count(Customer.id).label("new_customers"))
        .where(*filters)
        .group_by(period_expr)
        .order_by(period_expr)
    )
    return [{"period": r.period, "new_customers": r.new_customers} for r in db.execute(stmt).all()]


def get_segment_breakdown(db: Session, start_date: date | None = None, end_date: date | None = None) -> list[dict]:
    filters = _date_filters(start_date, end_date)
    stmt = (
        select(
            Customer.segment.label("segment"),
            func.sum(SalesOrder.total_amount).label("revenue"),
            func.count(SalesOrder.id).label("orders"),
            func.count(func.distinct(SalesOrder.customer_id)).label("customers"),
        )
        .join(Customer, SalesOrder.customer_id == Customer.id)
        .where(SalesOrder.status == "Completed", *filters)
        .group_by(Customer.segment)
        .order_by(func.sum(SalesOrder.total_amount).desc())
    )
    return [
        {
            "segment": r.segment,
            "revenue": round(r.revenue, 2),
            "orders": r.orders,
            "customers": r.customers,
        }
        for r in db.execute(stmt).all()
    ]


def get_customer_retention(db: Session, start_date: date | None = None, end_date: date | None = None) -> dict:
    """Repeat-purchase rate among customers with at least one completed order in range."""
    filters = _date_filters(start_date, end_date)
    per_customer = (
        select(SalesOrder.customer_id, func.count(SalesOrder.id).label("order_count"))
        .where(SalesOrder.status == "Completed", *filters)
        .group_by(SalesOrder.customer_id)
        .subquery()
    )
    stmt = select(
        func.count(per_customer.c.customer_id).label("total_customers"),
        func.sum(case((per_customer.c.order_count > 1, 1), else_=0)).label("repeat_customers"),
        func.avg(per_customer.c.order_count).label("avg_orders_per_customer"),
    )
    row = db.execute(stmt).one()
    total = row.total_customers or 0
    repeat = row.repeat_customers or 0
    repeat_rate = (repeat / total * 100) if total else 0.0
    return {
        "total_active_customers": total,
        "repeat_customers": repeat,
        "repeat_purchase_rate_pct": round(repeat_rate, 2),
        "avg_orders_per_customer": round(row.avg_orders_per_customer or 0.0, 2),
    }


def get_activity_heatmap(db: Session, start_date: date | None = None, end_date: date | None = None) -> list[dict]:
    """Order volume by weekday x hour-of-day, for a shopping-activity heatmap."""
    filters = _date_filters(start_date, end_date)
    weekday_expr = func.strftime("%w", SalesOrder.created_at)  # 0=Sunday..6=Saturday
    hour_expr = func.cast(func.strftime("%H", SalesOrder.created_at), Integer)
    stmt = (
        select(
            weekday_expr.label("weekday"),
            hour_expr.label("hour"),
            func.count(SalesOrder.id).label("orders"),
        )
        .where(SalesOrder.status == "Completed", *filters)
        .group_by(weekday_expr, hour_expr)
    )
    return [{"weekday": int(r.weekday), "hour": int(r.hour), "orders": r.orders} for r in db.execute(stmt).all()]


def get_channel_performance(db: Session, start_date: date | None = None, end_date: date | None = None) -> list[dict]:
    filters = _date_filters(start_date, end_date)
    stmt = (
        select(
            Store.channel.label("channel"),
            func.sum(SalesOrder.total_amount).label("revenue"),
            func.count(SalesOrder.id).label("orders"),
            func.count(func.distinct(SalesOrder.customer_id)).label("customers"),
        )
        .join(Store, SalesOrder.store_id == Store.id)
        .where(SalesOrder.status == "Completed", *filters)
        .group_by(Store.channel)
        .order_by(func.sum(SalesOrder.total_amount).desc())
    )
    out = []
    for r in db.execute(stmt).all():
        avg_order_value = (r.revenue / r.orders) if r.orders else 0.0
        out.append(
            {
                "channel": r.channel,
                "revenue": round(r.revenue, 2),
                "orders": r.orders,
                "customers": r.customers,
                "avg_order_value": round(avg_order_value, 2),
            }
        )
    return out
