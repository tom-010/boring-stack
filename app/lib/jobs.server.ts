import { quickAddJob } from "graphile-worker";
import { config } from "~/lib/config.server";

const connectionString = config.db.url;

export interface GenerateThumbnailPayload {
  attachmentId: string;
  filepath: string;
}

export async function queueThumbnailJob(payload: GenerateThumbnailPayload) {
  await quickAddJob({ connectionString }, "generateThumbnail", payload);
}
