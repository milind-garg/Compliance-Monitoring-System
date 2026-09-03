from fastapi import APIRouter
from .compliance import router as compliance_router

router = APIRouter(prefix="/v1")
router.include_router(compliance_router)
