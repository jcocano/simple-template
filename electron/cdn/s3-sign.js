// AWS Signature V4 signer for S3 PUT requests. Self-contained: uses only
// Node's built-in `crypto` module, no AWS SDK. Works against every S3-
// compatible storage service that accepts SigV4 path-style URLs:
//   - AWS S3
//   - Cloudflare R2 (region "auto")
//   - Backblaze B2 (via S3 API)
//   - Wasabi
//   - MinIO
//   - DigitalOcean Spaces
//
// We use path-style (`<endpoint>/<bucket>/<key>`) because it's universally
// supported — virtual-hosted-style requires per-bucket DNS which most non-
// AWS providers don't set up.
//
// Spec: https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-header-based-auth.html

const crypto = require('crypto');

function sha256Hex(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function hmacBytes(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function hmacHex(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

function deriveSigningKey(secretKey, date, region, service) {
  const kDate = hmacBytes('AWS4' + secretKey, date);
  const kRegion = hmacBytes(kDate, region);
  const kService = hmacBytes(kRegion, service);
  return hmacBytes(kService, 'aws4_request');
}

// S3 object key encoding: RFC 3986 with `/` preserved (it's a path separator).
function encodeObjectKey(key) {
  return String(key)
    .split('/')
    .map((seg) =>
      encodeURIComponent(seg)
        // encodeURIComponent leaves these unescaped — RFC 3986 says they should stay.
        .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
    )
    .join('/');
}

// Build the signed PUT request. Caller does the actual fetch — we just return
// `{ url, headers }` so the renderer/main can send it however it wants.
//
// `body` is a Buffer. SigV4 requires the SHA256 hash of the body, which we
// compute here and include as the `x-amz-content-sha256` header.
function signedPutRequest({
  endpoint,
  region,
  bucket,
  key,
  accessKeyId,
  secretAccessKey,
  body,
  contentType,
}) {
  if (!endpoint || !bucket || !key || !accessKeyId || !secretAccessKey || !body) {
    throw new Error('signedPutRequest: faltan argumentos obligatorios.');
  }

  const service = 's3';
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = amzDate.slice(0, 8);

  const payloadHash = sha256Hex(body);
  const parsedEndpoint = new URL(endpoint);
  const host = parsedEndpoint.host;
  const encodedKey = encodeObjectKey(key);
  const canonicalUri = `/${encodeURIComponent(bucket)}/${encodedKey}`;

  const headers = {
    'host': host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  if (contentType) headers['content-type'] = contentType;

  const sortedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders =
    sortedHeaderNames
      .map((n) => `${n}:${String(headers[n]).trim()}`)
      .join('\n') + '\n';
  const signedHeaders = sortedHeaderNames.join(';');

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    '',            // empty canonical query string
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${date}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = deriveSigningKey(secretAccessKey, date, region, service);
  const signature = hmacHex(signingKey, stringToSign);

  const authorization =
    `AWS4-HMAC-SHA256 ` +
    `Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, ` +
    `Signature=${signature}`;

  const baseUrl = `${parsedEndpoint.protocol}//${parsedEndpoint.host}`;
  return {
    url: `${baseUrl}${canonicalUri}`,
    headers: { ...headers, authorization },
  };
}

module.exports = { signedPutRequest, encodeObjectKey };
