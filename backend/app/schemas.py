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
    orders_mom_growth_pct: float = 0.0
    aov_mom_growth_pct: float = 0.0
    customers_mom_growth_pct: float = 0.0
    refund_rate_mom_delta_pp: float = 0.0


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


class ProductMargin(BaseModel):
    name: str
    category: str
    revenue: float
    units_sold: int
    gross_profit: float
    margin_pct: float


class DiscountImpact(BaseModel):
    gross_revenue: float
    discount_given: float
    discount_pct_of_revenue: float
    avg_discount_pct: float


class ProductPerformanceData(BaseModel):
    top_products: list[TopProduct]
    product_margins: list[ProductMargin]
    category_breakdown: list[CategoryBreakdown]
    discount_impact: DiscountImpact


class FinanceSummary(BaseModel):
    revenue: float
    cogs: float
    gross_profit: float
    gross_margin_pct: float
    refunded_revenue: float
    discount_given: float
    discount_pct_of_revenue: float


class FinanceTrendPoint(BaseModel):
    period: str
    revenue: float
    cogs: float
    gross_profit: float


class FinanceData(BaseModel):
    summary: FinanceSummary
    trend: list[FinanceTrendPoint]
    region_breakdown: list[RegionBreakdown]
    channel_breakdown: list[ChannelBreakdown]


class NewCustomerPoint(BaseModel):
    period: str
    new_customers: int


class SegmentBreakdown(BaseModel):
    segment: str
    revenue: float
    orders: int
    customers: int


class CustomerRetention(BaseModel):
    total_active_customers: int
    repeat_customers: int
    repeat_purchase_rate_pct: float
    avg_orders_per_customer: float


class ChannelPerformance(BaseModel):
    channel: str
    revenue: float
    orders: int
    customers: int
    avg_order_value: float


class RevOpsData(BaseModel):
    new_customers_trend: list[NewCustomerPoint]
    segment_breakdown: list[SegmentBreakdown]
    retention: CustomerRetention
    channel_performance: list[ChannelPerformance]


class HeatmapCell(BaseModel):
    weekday: int
    hour: int
    orders: int


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
