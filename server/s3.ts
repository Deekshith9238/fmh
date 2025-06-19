import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.***REMOVED***!,
    secretAccessKey: process.env.***REMOVED***!,
  },
});

export async function uploadToS3(fileBuffer: Buffer, originalName: string, folder: string, mimetype: string) {
  const key = `${folder}/${uuidv4()}_${originalName}`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    Body: fileBuffer,
    ContentType: mimetype,
    ACL: 'public-read',
  }));
  return `${process.env.S3_BASE_URL}/${key}`;
} 