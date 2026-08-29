import "server-only";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import type { CommunityMediaObject, CommunityMediaStore } from "@/lib/community/media";

export type R2S3Configuration = {
  readonly accountId: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly bucket: string;
};

export function getR2S3Configuration(): R2S3Configuration | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  return accountId && accessKeyId && secretAccessKey && bucket
    ? { accountId, accessKeyId, secretAccessKey, bucket }
    : null;
}

/** Private R2 adapter for Node/Vercel. It intentionally exposes no public URL. */
export class R2S3MediaStore implements CommunityMediaStore {
  private readonly client: S3Client;

  constructor(private readonly configuration: R2S3Configuration) {
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${configuration.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: configuration.accessKeyId,
        secretAccessKey: configuration.secretAccessKey,
      },
    });
  }

  async put(
    key: string,
    value: ArrayBuffer,
    options: {
      readonly httpMetadata: { readonly contentType: string };
      readonly customMetadata: Record<string, string>;
    },
  ): Promise<void> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.configuration.bucket,
      Key: key,
      Body: new Uint8Array(value),
      ContentType: options.httpMetadata.contentType,
      Metadata: options.customMetadata,
    }));
  }

  async get(key: string): Promise<CommunityMediaObject | null> {
    try {
      const result = await this.client.send(new GetObjectCommand({ Bucket: this.configuration.bucket, Key: key }));
      if (!result.Body) return null;
      return {
        body: result.Body.transformToWebStream(),
        httpMetadata: { contentType: result.ContentType },
        size: result.ContentLength,
      };
    } catch (error) {
      if (typeof error === "object" && error !== null && "$metadata" in error) {
        const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
        if (status === 404) return null;
      }
      throw error;
    }
  }
}

export function createConfiguredR2S3MediaStore(): CommunityMediaStore | undefined {
  const configuration = getR2S3Configuration();
  return configuration ? new R2S3MediaStore(configuration) : undefined;
}
