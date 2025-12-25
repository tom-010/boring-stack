import logging
from io import BytesIO
from logger import init_logging
init_logging()

from fastapi import FastAPI, File, Query, UploadFile
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
from PIL import Image


log = logging.getLogger("app")

app = FastAPI(title="Image Resize Service")


@app.get("/hi")
async def hello():
    """Simple endpoint to verify the service is running."""
    log.debug("debug message")
    log.info("info message")
    log.warning("warning message")
    log.error("error message")
    log.critical("critical message")
    return {"message": "Hello, World!"}

class GreetPersonSchema(BaseModel):
    first_name: str
    last_name: str

@app.post("/greet")
async def greet_person(person: GreetPersonSchema):
    """Greet a person by their first and last name."""
    greeting = f"Hello, {person.first_name} {person.last_name}!"
    log.info(f"Greeting generated: {greeting}")
    return {"greeting": greeting}

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
    
    log.info("starting server on 0.0.0.0:8001")
    uvicorn.run(app, host="0.0.0.0", port=8001)
