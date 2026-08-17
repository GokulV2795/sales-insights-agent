from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import analytics
from app.database import get_db
from app.schemas import DashboardData, FinanceData, HeatmapCell, ProductPerformanceData, RevOpsData

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


@router.get("/activity-heatmap", response_model=list[HeatmapCell])
def get_activity_heatmap(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    db: Session = Depends(get_db),
):
    return analytics.get_activity_heatmap(db, start_date, end_date)


@router.get("/product-performance", response_model=ProductPerformanceData)
def get_product_performance(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    db: Session = Depends(get_db),
):
    return {
        "top_products": analytics.get_top_products(db, start_date, end_date, limit=8),
        "product_margins": analytics.get_product_margins(db, start_date, end_date, limit=15),
        "category_breakdown": analytics.get_category_breakdown(db, start_date, end_date),
        "discount_impact": analytics.get_discount_impact(db, start_date, end_date),
    }


@router.get("/finance", response_model=FinanceData)
def get_finance(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    db: Session = Depends(get_db),
):
    return {
        "summary": analytics.get_finance_summary(db, start_date, end_date),
        "trend": analytics.get_finance_trend(db, start_date, end_date),
        "region_breakdown": analytics.get_region_breakdown(db, start_date, end_date),
        "channel_breakdown": analytics.get_channel_breakdown(db, start_date, end_date),
    }


@router.get("/revops", response_model=RevOpsData)
def get_revops(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    db: Session = Depends(get_db),
):
    return {
        "new_customers_trend": analytics.get_new_customers_trend(db, start_date, end_date),
        "segment_breakdown": analytics.get_segment_breakdown(db, start_date, end_date),
        "retention": analytics.get_customer_retention(db, start_date, end_date),
        "channel_performance": analytics.get_channel_performance(db, start_date, end_date),
    }
