import logging
import os
from io import BytesIO
from pathlib import Path

from logger import init_logging

init_logging()

from fastapi import FastAPI, File, Query, UploadFile
from fastapi.responses import StreamingResponse
from PIL import Image
from pydantic import BaseModel

log = logging.getLogger("app")

app = FastAPI(title="Image Resize Service")

# Base path for uploads (configurable via env, defaults to ../public relative to this file)
UPLOADS_BASE = Path(os.getenv("UPLOADS_BASE", str(Path(__file__).parent.parent / "public")))


# --- Models ---


class HelloResponse(BaseModel):
    message: str


class GreetPersonRequest(BaseModel):
    first_name: str
    last_name: str


class GreetPersonResponse(BaseModel):
    greeting: str


class GenerateThumbnailRequest(BaseModel):
    filepath: str  # e.g., "/uploads/123-file.jpg"
    width: int = 200
    height: int = 200


class GenerateThumbnailResponse(BaseModel):
    thumbnail_path: str  # e.g., "/uploads/thumbnails/thumb-123-file.jpg"


# --- Endpoints ---


@app.get("/hi")
async def hello() -> HelloResponse:
    """Simple endpoint to verify the service is running."""
    log.debug("debug message")
    log.info("info message")
    log.warning("warning message")
    log.error("error message")
    log.critical("critical message")
    return HelloResponse(message="Hello, World!")


@app.post("/greet")
async def greet_person(person: GreetPersonRequest) -> GreetPersonResponse:
    """Greet a person by their first and last name."""
    greeting = f"Hello, {person.first_name} {person.last_name}!"
    log.info(f"Greeting generated: {greeting}")
    return GreetPersonResponse(greeting=greeting)


@app.post("/resize")
async def resize_image(
    file: UploadFile = File(...),
    width: int = Query(..., gt=0, le=4096, description="Target width in pixels"),
    height: int = Query(..., gt=0, le=4096, description="Target height in pixels"),
) -> StreamingResponse:
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


@app.post("/generate-thumbnail")
async def generate_thumbnail(request: GenerateThumbnailRequest) -> GenerateThumbnailResponse:
    """Generate a thumbnail for an image file on disk."""
    # Extract filename from filepath (e.g., /uploads/123-file.jpg -> 123-file.jpg)
    filename = request.filepath.replace("/uploads/", "")

    input_path = UPLOADS_BASE / "uploads" / filename
    thumbs_dir = UPLOADS_BASE / "uploads" / "thumbnails"
    thumbs_dir.mkdir(parents=True, exist_ok=True)

    # Generate thumbnail filename
    thumb_filename = f"thumb-{filename}"
    # Ensure .jpg extension for thumbnails
    thumb_filename = Path(thumb_filename).stem + ".jpg"
    output_path = thumbs_dir / thumb_filename

    log.info(f"Generating thumbnail: {input_path} -> {output_path}")

    # Open and resize image
    with Image.open(input_path) as img:
        # Convert to RGB if necessary (for PNG with transparency, etc.)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        # Calculate crop box for center crop
        orig_width, orig_height = img.size
        target_ratio = request.width / request.height
        orig_ratio = orig_width / orig_height

        if orig_ratio > target_ratio:
            # Image is wider, crop sides
            new_width = int(orig_height * target_ratio)
            left = (orig_width - new_width) // 2
            img = img.crop((left, 0, left + new_width, orig_height))
        else:
            # Image is taller, crop top/bottom
            new_height = int(orig_width / target_ratio)
            top = (orig_height - new_height) // 2
            img = img.crop((0, top, orig_width, top + new_height))

        # Resize to target dimensions
        img = img.resize((request.width, request.height), Image.Resampling.LANCZOS)

        # Save as JPEG
        img.save(output_path, "JPEG", quality=80)

    thumbnail_path = f"/uploads/thumbnails/{thumb_filename}"
    log.info(f"Thumbnail generated: {thumbnail_path}")

    return GenerateThumbnailResponse(thumbnail_path=thumbnail_path)


if __name__ == "__main__":
    import uvicorn

    log.info("starting server on 0.0.0.0:8123")
    uvicorn.run(app, host="0.0.0.0", port=8123)
