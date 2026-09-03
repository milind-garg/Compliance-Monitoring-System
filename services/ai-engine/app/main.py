import sys
sys.path.insert(0, "/app/shared_utils")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import router as v1_router
from app.config import settings
from logging_config import setup_logging

setup_logging("ai-engine", settings.log_level)

app = FastAPI(title="AI Engine", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins.split(","), allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(v1_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-engine"}
