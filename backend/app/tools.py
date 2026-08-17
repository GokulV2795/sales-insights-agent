"""LangChain tools that give the sales chatbot agent access to the sales
database: a handful of curated aggregation tools (fast, reliable for common
questions) plus a restricted raw-SQL tool for anything more open-ended."""

import json
from datetime import date, datetime

from langchain_core.tools import tool
from sqlalchemy import text

from app import analytics
from app.database import SessionLocal

SCHEMA_DESCRIPTION = """
Tables available in the read-only SQLite sales database:

regions(id, name)
stores(id, name, channel, region_id)          -- channel: Online, Retail, Partner
categories(id, name)
products(id, name, sku, category_id, unit_price, unit_cost, launch_date)
customers(id, name, segment, region_id, signup_date)  -- segment: Enterprise, SMB, Consumer
sales_orders(id, order_date, customer_id, product_id, store_id, quantity,
             unit_price, discount_pct, total_amount, status, created_at)
             -- status: Completed, Refunded, Cancelled. Revenue analysis
             -- should normally filter status = 'Completed'.
"""


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    return datetime.strptime(value, "%Y-%m-%d").date()


@tool
def get_kpi_summary(start_date: str | None = None, end_date: str | None = None) -> str:
    """Get top-line sales KPIs (total revenue, orders, units, avg order value,
    unique customers, refund rate, month-over-month revenue growth).
    Dates are optional, format YYYY-MM-DD. Omit both for all-time KPIs."""
    db = SessionLocal()
    try:
        data = analytics.get_kpis(db, _parse_date(start_date), _parse_date(end_date))
        return json.dumps(data)
    finally:
        db.close()


@tool
def get_revenue_trend(start_date: str | None = None, end_date: str | None = None) -> str:
    """Get monthly revenue and order-count trend. Dates optional, YYYY-MM-DD."""
    db = SessionLocal()
    try:
        data = analytics.get_revenue_trend(db, _parse_date(start_date), _parse_date(end_date))
        return json.dumps(data)
    finally:
        db.close()


@tool
def get_top_products(start_date: str | None = None, end_date: str | None = None, limit: int = 10) -> str:
    """Get the top-selling products by revenue, with category and units sold.
    Dates optional, YYYY-MM-DD. limit defaults to 10."""
    db = SessionLocal()
    try:
        data = analytics.get_top_products(db, _parse_date(start_date), _parse_date(end_date), limit)
        return json.dumps(data)
    finally:
        db.close()


@tool
def get_region_breakdown(start_date: str | None = None, end_date: str | None = None) -> str:
    """Get revenue and order counts grouped by customer region. Dates optional, YYYY-MM-DD."""
    db = SessionLocal()
    try:
        data = analytics.get_region_breakdown(db, _parse_date(start_date), _parse_date(end_date))
        return json.dumps(data)
    finally:
        db.close()


@tool
def get_category_breakdown(start_date: str | None = None, end_date: str | None = None) -> str:
    """Get revenue and units sold grouped by product category. Dates optional, YYYY-MM-DD."""
    db = SessionLocal()
    try:
        data = analytics.get_category_breakdown(db, _parse_date(start_date), _parse_date(end_date))
        return json.dumps(data)
    finally:
        db.close()


@tool
def get_channel_breakdown(start_date: str | None = None, end_date: str | None = None) -> str:
    """Get revenue and order counts grouped by sales channel (Online, Retail, Partner).
    Dates optional, YYYY-MM-DD."""
    db = SessionLocal()
    try:
        data = analytics.get_channel_breakdown(db, _parse_date(start_date), _parse_date(end_date))
        return json.dumps(data)
    finally:
        db.close()


@tool(description="Run a read-only SQL SELECT query against the sales database for "
    "questions the other tools can't answer directly (e.g. specific customer "
    "lookups, unusual groupings, filtering by segment/sku/channel together). "
    "Only SELECT statements are allowed. Results are capped at 200 rows.\n\nSchema:\n" + SCHEMA_DESCRIPTION)
def run_sql_query(query: str) -> str:
    normalized = query.strip().rstrip(";")
    lowered = normalized.lower()
    if not lowered.startswith("select"):
        return json.dumps({"error": "Only SELECT statements are allowed."})
    forbidden = ["insert", "update", "delete", "drop", "alter", "attach", "pragma", "create"]
    if any(word in lowered for word in forbidden):
        return json.dumps({"error": "Query contains a disallowed keyword."})

    db = SessionLocal()
    try:
        result = db.execute(text(f"{normalized} LIMIT 200"))
        rows = [dict(row._mapping) for row in result]
        return json.dumps(rows, default=str)
    except Exception as exc:  # noqa: BLE001
        return json.dumps({"error": str(exc)})
    finally:
        db.close()


ALL_TOOLS = [
    get_kpi_summary,
    get_revenue_trend,
    get_top_products,
    get_region_breakdown,
    get_category_breakdown,
    get_channel_breakdown,
    run_sql_query,
]
