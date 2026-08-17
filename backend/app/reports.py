from datetime import date, datetime
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy.orm import Session

from app import analytics
from app.llm import get_chat_model


def build_cumulative_report(db: Session, as_of: date | None = None) -> dict:
    if as_of is None:
        _, max_date = analytics.get_date_bounds(db)
        as_of = max_date or date.today()

    kpis = analytics.get_kpis(db, start_date=None, end_date=as_of)
    cumulative_trend = analytics.get_cumulative_trend(db, as_of)
    top_products = analytics.get_top_products(db, start_date=None, end_date=as_of, limit=10)
    region_breakdown = analytics.get_region_breakdown(db, start_date=None, end_date=as_of)

    narrative = _generate_narrative(kpis, cumulative_trend, top_products, region_breakdown, as_of)

    return {
        "as_of": as_of,
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "kpis": kpis,
        "cumulative_trend": cumulative_trend,
        "top_products_cumulative": top_products,
        "region_breakdown_cumulative": region_breakdown,
        "narrative_summary": narrative,
    }


def _generate_narrative(kpis: dict, trend: list[dict], top_products: list[dict], regions: list[dict], as_of: date) -> str:
    try:
        llm = get_chat_model(temperature=0.4)
        top3 = ", ".join(p["name"] for p in top_products[:3]) or "N/A"
        top_region = regions[0]["region"] if regions else "N/A"
        prompt = (
            "Write a concise (120-180 word) executive summary of cumulative company "
            f"sales performance as of {as_of.isoformat()}, for a leadership report. "
            f"Cumulative revenue to date: ${kpis['total_revenue']:,.2f} across "
            f"{kpis['total_orders']:,} completed orders ({kpis['unique_customers']:,} unique customers). "
            f"Average order value: ${kpis['avg_order_value']:,.2f}. "
            f"Refund rate: {kpis['refund_rate_pct']}%. "
            f"Latest month-over-month revenue growth: {kpis['revenue_mom_growth_pct']}%. "
            f"Top-selling products cumulatively: {top3}. "
            f"Top-performing region: {top_region}. "
            "Mention notable trends and one actionable recommendation. Plain prose, no headers, no bullet points."
        )
        response = llm.invoke(prompt)
        return response.content.strip()
    except Exception as exc:  # noqa: BLE001
        return (
            f"[Narrative generation unavailable: {exc}] Cumulative revenue as of {as_of.isoformat()} is "
            f"${kpis['total_revenue']:,.2f} across {kpis['total_orders']:,} orders."
        )


def render_report_pdf(report: dict) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, title="Cumulative Sales Report")
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("Cumulative Sales Report", styles["Title"]))
    story.append(Paragraph(f"As of {report['as_of']}", styles["Normal"]))
    story.append(Paragraph(f"Generated {report['generated_at']}", styles["Normal"]))
    story.append(Spacer(1, 16))

    story.append(Paragraph("Executive Summary", styles["Heading2"]))
    story.append(Paragraph(report["narrative_summary"], styles["BodyText"]))
    story.append(Spacer(1, 16))

    kpis = report["kpis"]
    kpi_rows = [
        ["Metric", "Value"],
        ["Total Revenue", f"${kpis['total_revenue']:,.2f}"],
        ["Total Orders", f"{kpis['total_orders']:,}"],
        ["Total Units Sold", f"{kpis['total_units']:,}"],
        ["Avg Order Value", f"${kpis['avg_order_value']:,.2f}"],
        ["Unique Customers", f"{kpis['unique_customers']:,}"],
        ["Refund Rate", f"{kpis['refund_rate_pct']}%"],
        ["Latest MoM Growth", f"{kpis['revenue_mom_growth_pct']}%"],
    ]
    story.append(Paragraph("Key Performance Indicators", styles["Heading2"]))
    story.append(_styled_table(kpi_rows))
    story.append(Spacer(1, 16))

    story.append(Paragraph("Top Products (Cumulative)", styles["Heading2"]))
    prod_rows = [["Product", "Category", "Revenue", "Units Sold"]]
    for p in report["top_products_cumulative"]:
        prod_rows.append([p["name"], p["category"], f"${p['revenue']:,.2f}", str(p["units_sold"])])
    story.append(_styled_table(prod_rows))
    story.append(Spacer(1, 16))

    story.append(Paragraph("Revenue by Region (Cumulative)", styles["Heading2"]))
    region_rows = [["Region", "Revenue", "Orders"]]
    for r in report["region_breakdown_cumulative"]:
        region_rows.append([r["region"], f"${r['revenue']:,.2f}", str(r["orders"])])
    story.append(_styled_table(region_rows))

    doc.build(story)
    return buffer.getvalue()


def _styled_table(rows: list[list[str]]) -> Table:
    table = Table(rows, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f3f4f6")]),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    return table
