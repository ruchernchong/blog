import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ERROR_IDS } from "@/constants/error-ids";
import { R2Config } from "@/lib/config/r2.config";
import { logError } from "@/lib/logger";

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

export interface UploadMetadata {
  filename: string;
  mimeType: string;
  size: number;
}

export interface DirectUploadResult {
  key: string;
  publicUrl: string;
  size: number;
}

export class R2Service {
  private client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
      },
    });
    this.bucketName = process.env.R2_BUCKET_NAME as string;
    this.publicUrl = process.env.R2_PUBLIC_URL as string;
  }

  generateKey(filename: string): string {
    const uuid = crypto.randomUUID();
    const sanitisedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `media/${uuid}-${sanitisedFilename}`;
  }

  async createPresignedUpload(
    metadata: UploadMetadata,
  ): Promise<PresignedUploadResult> {
    const { filename, mimeType, size } = metadata;

    if (
      !R2Config.ALLOWED_MIME_TYPES.includes(
        mimeType as (typeof R2Config.ALLOWED_MIME_TYPES)[number],
      )
    ) {
      throw new Error(`Invalid file type: ${mimeType}`);
    }

    if (size > R2Config.MAX_FILE_SIZE) {
      throw new Error(
        `File too large. Maximum size: ${R2Config.MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    const key = this.generateKey(filename);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: mimeType,
      ContentLength: size,
    });

    try {
      const uploadUrl = await getSignedUrl(this.client, command, {
        expiresIn: R2Config.SIGNED_URL_EXPIRATION,
      });

      return {
        uploadUrl,
        key,
        publicUrl: `${this.publicUrl}/${key}`,
      };
    } catch (error) {
      logError(ERROR_IDS.R2_PRESIGN_FAILED, error, { filename, mimeType });
      throw error;
    }
  }

  async uploadObject(
    buffer: Buffer | Uint8Array,
    filename: string,
    mimeType: string,
  ): Promise<DirectUploadResult> {
    if (
      !R2Config.ALLOWED_MIME_TYPES.includes(
        mimeType as (typeof R2Config.ALLOWED_MIME_TYPES)[number],
      )
    ) {
      throw new Error(`Invalid file type: ${mimeType}`);
    }

    if (buffer.length > R2Config.MAX_FILE_SIZE) {
      throw new Error(
        `File too large. Maximum size: ${R2Config.MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    const key = this.generateKey(filename);

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ContentLength: buffer.length,
      });
      await this.client.send(command);

      return {
        key,
        publicUrl: `${this.publicUrl}/${key}`,
        size: buffer.length,
      };
    } catch (error) {
      logError(ERROR_IDS.R2_UPLOAD_FAILED, error, { filename, mimeType });
      throw error;
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.client.send(command);
    } catch (error) {
      logError(ERROR_IDS.R2_DELETE_FAILED, error, { key });
      throw error;
    }
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  async objectExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch (error) {
      // NotFound error means object doesn't exist - this is expected
      if (
        error instanceof Error &&
        (error.name === "NotFound" || error.name === "NoSuchKey")
      ) {
        return false;
      }
      // Log unexpected errors but return false to be safe
      logError(ERROR_IDS.R2_HEAD_FAILED, error, { key });
      return false;
    }
  }

  async checkObjectsExist(keys: string[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    await Promise.all(
      keys.map(async (key) => {
        const exists = await this.objectExists(key);
        results.set(key, exists);
      }),
    );
    return results;
  }
}
