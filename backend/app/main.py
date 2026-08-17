from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import chat, dashboard, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_path = Path(settings.database_url.replace("sqlite:///", ""))
    if not db_path.exists():
        from app.seed_data import main as seed_main

        seed_main()
    else:
        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Sales Insights API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(chat.router)
app.include_router(reports.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
