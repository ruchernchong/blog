import {
  DeleteObjectCommand,
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
}
