"""Thin async RabbitMQ publisher — consume with aio_pika or Celery."""
import json
import uuid
from datetime import datetime, timezone
from typing import Any

import aio_pika


async def publish_event(
    channel: aio_pika.abc.AbstractChannel,
    exchange: str,
    routing_key: str,
    payload: dict[str, Any],
) -> None:
    body = json.dumps(
        {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": payload,
        }
    ).encode()
    ex = await channel.get_exchange(exchange, ensure=False)
    await ex.publish(aio_pika.Message(body=body, content_type="application/json"), routing_key=routing_key)
