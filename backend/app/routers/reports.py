from datetime import date

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app import reports as reports_service
from app.database import get_db
from app.schemas import CumulativeReport

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/cumulative", response_model=CumulativeReport)
def get_cumulative_report(as_of: date | None = Query(None), db: Session = Depends(get_db)):
    return reports_service.build_cumulative_report(db, as_of)


@router.get("/cumulative/pdf")
def get_cumulative_report_pdf(as_of: date | None = Query(None), db: Session = Depends(get_db)):
    report = reports_service.build_cumulative_report(db, as_of)
    pdf_bytes = reports_service.render_report_pdf(report)
    filename = f"cumulative-sales-report-{report['as_of']}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
