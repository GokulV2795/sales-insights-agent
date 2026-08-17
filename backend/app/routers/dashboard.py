from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import analytics
from app.database import get_db
from app.schemas import DashboardData

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardData)
def get_dashboard(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    db: Session = Depends(get_db),
):
    kpis = analytics.get_kpis(db, start_date, end_date)
    revenue_trend = analytics.get_revenue_trend(db, start_date, end_date)
    top_products = analytics.get_top_products(db, start_date, end_date, limit=8)
    region_breakdown = analytics.get_region_breakdown(db, start_date, end_date)
    category_breakdown = analytics.get_category_breakdown(db, start_date, end_date)
    channel_breakdown = analytics.get_channel_breakdown(db, start_date, end_date)

    return {
        "kpis": kpis,
        "revenue_trend": revenue_trend,
        "top_products": top_products,
        "region_breakdown": region_breakdown,
        "category_breakdown": category_breakdown,
        "channel_breakdown": channel_breakdown,
    }


@router.get("/date-bounds")
def get_date_bounds(db: Session = Depends(get_db)):
    min_date, max_date = analytics.get_date_bounds(db)
    return {"min_date": min_date, "max_date": max_date}
