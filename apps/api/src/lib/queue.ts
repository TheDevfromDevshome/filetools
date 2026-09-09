import { Queue } from "bullmq";
import { Redis } from "ioredis";

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export function createQueue(name: string): Queue {
  return new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: { age: 3600, count: 1000 },
      removeOnFail: { age: 86400, count: 500 },
    },
  });
}

export const imageQueue = createQueue("image-convert");
export const pdfQueue = createQueue("pdf-convert");
export const mediaQueue = createQueue("media-convert");
export const archiveQueue = createQueue("archive-convert");
export const documentQueue = createQueue("document-convert");

export function getQueueForWorker(workerQueue: string): Queue {
  switch (workerQueue) {
    case "image-convert":
      return imageQueue;
    case "pdf-convert":
      return pdfQueue;
    case "media-convert":
      return mediaQueue;
    case "archive-convert":
      return archiveQueue;
    case "document-convert":
      return documentQueue;
    default:
      throw new Error(`Unknown worker queue: ${workerQueue}`);
  }
}

export { connection as redisConnection };
