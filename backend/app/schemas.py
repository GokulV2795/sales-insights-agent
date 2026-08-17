from datetime import date

from pydantic import BaseModel


class KPISummary(BaseModel):
    total_revenue: float
    total_orders: int
    total_units: int
    avg_order_value: float
    unique_customers: int
    refund_rate_pct: float
    revenue_mom_growth_pct: float


class TrendPoint(BaseModel):
    period: str
    revenue: float
    orders: int


class TopProduct(BaseModel):
    name: str
    category: str
    revenue: float
    units_sold: int


class RegionBreakdown(BaseModel):
    region: str
    revenue: float
    orders: int


class CategoryBreakdown(BaseModel):
    category: str
    revenue: float
    units_sold: int


class ChannelBreakdown(BaseModel):
    channel: str
    revenue: float
    orders: int


class DashboardData(BaseModel):
    kpis: KPISummary
    revenue_trend: list[TrendPoint]
    top_products: list[TopProduct]
    region_breakdown: list[RegionBreakdown]
    category_breakdown: list[CategoryBreakdown]
    channel_breakdown: list[ChannelBreakdown]


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatResponse(BaseModel):
    reply: str
    session_id: str


class CumulativeReportRequest(BaseModel):
    as_of: date | None = None


class CumulativeMonthPoint(BaseModel):
    period: str
    cumulative_revenue: float
    cumulative_orders: int
    cumulative_units: int


class CumulativeReport(BaseModel):
    as_of: date
    generated_at: str
    kpis: KPISummary
    cumulative_trend: list[CumulativeMonthPoint]
    top_products_cumulative: list[TopProduct]
    region_breakdown_cumulative: list[RegionBreakdown]
    narrative_summary: str
