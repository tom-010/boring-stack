import logging
import os
import sys


def init_logging():
    # Logging setup
    is_dev = os.environ.get("ENV", "development") == "development"
    logging.basicConfig(
        level=logging.DEBUG if is_dev else logging.INFO,
        format="%(asctime)s %(levelname)-8s %(name)s:%(lineno)d: %(message)s",
        datefmt="%H:%M:%S" if is_dev else "%Y-%m-%dT%H:%M:%S",
        stream=sys.stdout,
        force=True,
    )
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
