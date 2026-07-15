import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

export function getBucketConfig() {
  return {
    bucketName: process.env.AWS_BUCKET_NAME ?? '',
    folderPrefix: process.env.AWS_FOLDER_PREFIX ?? '',
  }
}

type Creds = {
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
  expiration?: Date
}

// In-memory cache of the most recently resolved credentials.
let cachedCreds: Creds | null = null

/**
 * The hosting platform publishes freshly-rotated storage credentials to a
 * central S3 location (ABACUS_AWS_REFRESH_LOCATION). Unlike the temporary
 * credentials snapshotted into ABACUS_AWS_* env vars at process start (which
 * expire after a few hours and are never refreshed inside a long-running
 * deployment), this location is kept current by the platform. Reading it lets
 * the app self-refresh its credentials instead of failing with
 * InvalidAccessKeyId once the initial snapshot expires.
 */
async function fetchFreshCredentials(): Promise<Creds | null> {
  const loc = process.env.ABACUS_AWS_REFRESH_LOCATION
  if (!loc) return null
  const match = loc.match(/^s3:\/\/([^/]+)\/(.+)$/)
  if (!match) return null

  // Bootstrap the read with still-valid cached creds when possible, otherwise
  // fall back to the env snapshot.
  const bootstrap: Creds | null =
    cachedCreds && cachedCreds.expiration && cachedCreds.expiration.getTime() > Date.now() + 60_000
      ? cachedCreds
      : process.env.ABACUS_AWS_ACCESS_KEY_ID
      ? {
          accessKeyId: process.env.ABACUS_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.ABACUS_AWS_SECRET_ACCESS_KEY ?? '',
          sessionToken: process.env.ABACUS_AWS_SESSION_TOKEN,
        }
      : null
  if (!bootstrap) return null

  try {
    const s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-west-2',
      credentials: {
        accessKeyId: bootstrap.accessKeyId,
        secretAccessKey: bootstrap.secretAccessKey,
        sessionToken: bootstrap.sessionToken,
      },
    })
    const res = await s3.send(new GetObjectCommand({ Bucket: match[1], Key: match[2] }))
    const body = await res.Body!.transformToString()
    const data = JSON.parse(body)
    const c = data.HostedStorageCredentials || data
    if (!c || !c.AccessKeyId) return null
    const realExpiration = c.Expiration ? new Date(c.Expiration) : undefined
    return {
      accessKeyId: c.AccessKeyId,
      secretAccessKey: c.SecretAccessKey,
      sessionToken: c.SessionToken,
      // Expire 15 minutes early so the SDK triggers a refresh while the current
      // credentials are still valid enough to read the refresh location again.
      expiration: realExpiration ? new Date(realExpiration.getTime() - 15 * 60_000) : undefined,
    }
  } catch {
    return null
  }
}

/**
 * A credential provider the AWS SDK will re-invoke automatically whenever the
 * returned credentials are near expiry, giving the app durable, auto-rotating
 * access to hosted storage in both dev and production.
 */
async function refreshingProvider(): Promise<Creds> {
  if (cachedCreds && cachedCreds.expiration && cachedCreds.expiration.getTime() > Date.now() + 5 * 60_000) {
    return cachedCreds
  }
  const fresh = await fetchFreshCredentials()
  if (fresh) {
    cachedCreds = fresh
    return fresh
  }
  // Last resort: the env snapshot (valid until its own expiration).
  if (process.env.ABACUS_AWS_ACCESS_KEY_ID) {
    cachedCreds = {
      accessKeyId: process.env.ABACUS_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.ABACUS_AWS_SECRET_ACCESS_KEY ?? '',
      sessionToken: process.env.ABACUS_AWS_SESSION_TOKEN,
      expiration: process.env.ABACUS_AWS_EXPIRATION ? new Date(process.env.ABACUS_AWS_EXPIRATION) : undefined,
    }
    return cachedCreds
  }
  throw new Error('No AWS credentials available for hosted storage')
}

export function createS3Client() {
  const region = process.env.AWS_REGION || 'us-west-2'

  // 1) Explicit static credentials in the environment take precedence.
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return new S3Client({
      region,
      endpoint: process.env.AWS_ENDPOINT_URL,    
      forcePathStyle: true,                        
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN,
      },
    })
  }

  // 2) Hosted platform credentials: use the self-refreshing provider so long
  //    running deployments do not fail once the initial snapshot expires.
  if (process.env.ABACUS_AWS_ACCESS_KEY_ID || process.env.ABACUS_AWS_REFRESH_LOCATION) {
    return new S3Client({ region, credentials: refreshingProvider })
  }

  // 3) Fall back to the default AWS credential provider chain (profiles,
  //    credential_process, instance role, etc.).
  return new S3Client({ region })
}
