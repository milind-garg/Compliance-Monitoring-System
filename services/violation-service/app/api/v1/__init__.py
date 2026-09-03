from fastapi import APIRouter
from .violations import router as violations_router

router = APIRouter(prefix="/v1")
router.include_router(violations_router)
