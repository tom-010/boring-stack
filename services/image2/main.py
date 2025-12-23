from concurrent import futures
from io import BytesIO

import grpc
from PIL import Image

import image_pb2
import image_pb2_grpc


class ImageServicer(image_pb2_grpc.ImageServiceServicer):
    def Resize(self, request, context):
        image = Image.open(BytesIO(request.image_data))

        resized = image.resize((request.width, request.height), Image.Resampling.LANCZOS)

        output = BytesIO()
        format = image.format or "PNG"
        resized.save(output, format=format)

        return image_pb2.ResizeResponse(
            image_data=output.getvalue(),
            format=format.lower(),
        )


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    image_pb2_grpc.add_ImageServiceServicer_to_server(ImageServicer(), server)
    server.add_insecure_port("[::]:50051")
    server.start()
    print("gRPC server running on port 50051")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
