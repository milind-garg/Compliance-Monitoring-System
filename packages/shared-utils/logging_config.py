import logging
import sys


def setup_logging(service_name: str, level: str = "INFO") -> None:
    fmt = f"%(asctime)s [{service_name}] %(levelname)s %(name)s: %(message)s"
    logging.basicConfig(
        stream=sys.stdout,
        level=getattr(logging, level.upper(), logging.INFO),
        format=fmt,
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
