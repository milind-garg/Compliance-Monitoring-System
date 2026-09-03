from typing import Generic, TypeVar
from pydantic import BaseModel
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    size: int
    pages: int


async def paginate(
    session: AsyncSession,
    query: Select,
    page: int = 1,
    size: int = 20,
) -> dict:
    size = min(size, 200)
    count_q = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_q)).scalar_one()
    rows = (await session.execute(query.offset((page - 1) * size).limit(size))).scalars().all()
    return {
        "items": rows,
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size,
    }
