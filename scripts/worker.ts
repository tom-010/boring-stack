import "dotenv/config";
import { run, type Task, type TaskList } from "graphile-worker";
import { PrismaClient } from "../node_modules/.prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@hey-api/client-fetch";
import { generateThumbnailGenerateThumbnailPost } from "../app/lib/py/gen/sdk.gen";
import type { GenerateThumbnailResponse } from "../app/lib/py/gen/types.gen";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// Configure Python service client for the worker
const pyClient = createClient({
  baseUrl: process.env.PY_URL ?? "http://localhost:8123",
});

interface GenerateThumbnailPayload {
  attachmentId: number;
  filepath: string;
}

const generateThumbnail: Task = async (payload, helpers) => {
  const { attachmentId, filepath } = payload as GenerateThumbnailPayload;
  helpers.logger.info(`Generating thumbnail for attachment ${attachmentId}`);

  try {
    const response = await generateThumbnailGenerateThumbnailPost({
      client: pyClient,
      body: {
        filepath,
        width: 200,
        height: 200,
      },
    });

    if (response.error || !response.data) {
      throw new Error(`Python service error: ${JSON.stringify(response.error)}`);
    }

    const data = response.data as unknown as GenerateThumbnailResponse;
    const thumbnailPath = data.thumbnail_path;

    await db.attachment.update({
      where: { id: attachmentId },
      data: { thumbnailPath },
    });

    helpers.logger.info(`Thumbnail generated: ${thumbnailPath}`);
  } catch (error) {
    helpers.logger.error(`Failed to generate thumbnail: ${error}`);
    throw error;
  }
};

const taskList: TaskList = {
  generateThumbnail,
};

async function main() {
  const runner = await run({
    connectionString: process.env.DATABASE_URL,
    concurrency: 5,
    noHandleSignals: false,
    pollInterval: 1000,
    taskList,
  });

  console.log("Worker started, waiting for jobs...");

  await runner.promise;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
