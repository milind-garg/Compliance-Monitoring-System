from fastapi import APIRouter
from .predictions import router as predictions_router

router = APIRouter(prefix="/v1")
router.include_router(predictions_router)
