from fastapi import APIRouter
from .inspections import router as inspections_router

router = APIRouter(prefix="/v1")
router.include_router(inspections_router)
