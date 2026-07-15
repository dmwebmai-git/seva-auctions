
import { 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand,
  CopyObjectCommand 
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createS3Client, getBucketConfig } from './aws-config'

const s3Client = createS3Client()
const { bucketName, folderPrefix } = getBucketConfig()

export async function uploadFile(buffer: Buffer, fileName: string): Promise<string> {
  const key = `${folderPrefix}uploads/${Date.now()}-${fileName}`
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: getContentType(fileName),
  })

  await s3Client.send(command)
  return key // Return the S3 key (cloud_storage_path)
}

export async function downloadFile(key: string): Promise<string> {
  // For now, return the public URL - can be enhanced later with signed URLs
  return getPublicUrl(key)
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  await s3Client.send(command)
}

export async function renameFile(oldKey: string, newKey: string): Promise<string> {
  // First copy the file
  const copyCommand = new CopyObjectCommand({
    Bucket: bucketName,
    Key: newKey,
    CopySource: `${bucketName}/${oldKey}`,
  })
  
  await s3Client.send(copyCommand)
  
  // Then delete the old file
  await deleteFile(oldKey)
  
  return newKey
}

function getContentType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const mimeTypes: { [key: string]: string } = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }
  
  return mimeTypes[ext || ''] || 'application/octet-stream'
}

export function getPublicUrl(key: string): string {
  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
}

/**
 * Reads a stored object and returns its raw bytes plus content type.
 * Used by the /api/images proxy to stream private objects to the browser
 * with server-side credentials.
 */
export async function getObjectBuffer(
  key: string
): Promise<{ buffer: Buffer; contentType: string }> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  const response = await s3Client.send(command)
  const bytes = await (response.Body as any).transformToByteArray()

  return {
    buffer: Buffer.from(bytes),
    contentType: response.ContentType || getContentType(key),
  }
}
