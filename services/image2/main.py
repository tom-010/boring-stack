import asyncio
from io import BytesIO

from grpclib.server import Server, Stream
from grpclib.utils import graceful_exit
from PIL import Image

from proto_out.image import ResizeRequest, ResizeResponse


class ImageService:
    async def Resize(self, stream: Stream[ResizeRequest, ResizeResponse]) -> None:
        request = await stream.recv_message()
        assert request is not None

        image = Image.open(BytesIO(request.image_data))
        resized = image.resize((request.width, request.height), Image.Resampling.LANCZOS)

        output = BytesIO()
        format = image.format or "PNG"
        resized.save(output, format=format)

        response = ResizeResponse(
            image_data=output.getvalue(),
            format=format.lower(),
        )
        await stream.send_message(response)

    def __mapping__(self):
        return {
            "/image.ImageService/Resize": self.Resize,
        }


async def main():
    server = Server([ImageService()])
    with graceful_exit([server]):
        await server.start("0.0.0.0", 50051)
        print("gRPC server running on port 50051")
        await server.wait_closed()


if __name__ == "__main__":
    asyncio.run(main())
