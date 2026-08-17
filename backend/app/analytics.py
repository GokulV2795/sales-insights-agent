"""Shared SQL aggregation helpers used by the dashboard, chat tools, and
cumulative report endpoints so all three surfaces stay consistent."""

from datetime import date

from sqlalchemy import func, select
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

    # Month-over-month growth based on the last two full/partial months in range.
    mom_growth = _revenue_mom_growth(db, start_date, end_date)

    return {
        "total_revenue": round(row.revenue, 2),
        "total_orders": row.orders,
        "total_units": row.units,
        "avg_order_value": round(avg_order_value, 2),
        "unique_customers": row.customers,
        "refund_rate_pct": round(refund_rate, 2),
        "revenue_mom_growth_pct": round(mom_growth, 2),
    }


def _revenue_mom_growth(db: Session, start_date: date | None, end_date: date | None) -> float:
    filters = _date_filters(start_date, end_date)
    period_expr = func.strftime("%Y-%m", SalesOrder.order_date)
    stmt = (
        select(period_expr.label("period"), func.sum(SalesOrder.total_amount).label("revenue"))
        .where(SalesOrder.status == "Completed", *filters)
        .group_by(period_expr)
        .order_by(period_expr)
    )
    rows = db.execute(stmt).all()
    if len(rows) < 2:
        return 0.0
    prev, curr = rows[-2].revenue, rows[-1].revenue
    if not prev:
        return 0.0
    return (curr - prev) / prev * 100


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
