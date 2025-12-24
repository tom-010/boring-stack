import logging
import os
import sys
from io import BytesIO

from fastapi import FastAPI, File, Query, UploadFile
from fastapi.responses import StreamingResponse
from PIL import Image

app = FastAPI(title="Image Resize Service")
log = logging.getLogger("app")


@app.get("/hi")
async def hello():
    """Simple endpoint to verify the service is running."""
    log.debug("debug message")
    log.info("info message")
    log.warning("warning message")
    log.error("error message")
    log.critical("critical message")
    return {"message": "Hello, World!"}


@app.post("/resize")
async def resize_image(
    file: UploadFile = File(...),
    width: int = Query(..., gt=0, le=4096, description="Target width in pixels"),
    height: int = Query(..., gt=0, le=4096, description="Target height in pixels"),
):
    """Resize an uploaded image to the specified dimensions."""
    contents = await file.read()
    image = Image.open(BytesIO(contents))

    log.info(f"resizing {file.filename} from {image.size} to ({width}, {height})")

    resized = image.resize((width, height), Image.Resampling.LANCZOS)

    output = BytesIO()
    format = image.format or "PNG"
    resized.save(output, format=format)
    output.seek(0)

    media_type = f"image/{format.lower()}"
    return StreamingResponse(output, media_type=media_type)


if __name__ == "__main__":
    import uvicorn

    is_dev = os.environ.get("ENV", "development") == "development"
    logging.basicConfig(
        level=logging.DEBUG if is_dev else logging.INFO,
        format="%(asctime)s %(levelname)-8s %(name)s:%(lineno)d — %(message)s",
        datefmt="%H:%M:%S" if is_dev else "%Y-%m-%dT%H:%M:%S",
        stream=sys.stdout,
        force=True,
    )
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

    log.info("starting server on 0.0.0.0:8001")
    uvicorn.run(app, host="0.0.0.0", port=8001)
