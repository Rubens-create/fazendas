export type SupportedCoverImage = {
  extension: 'jpg' | 'png' | 'webp';
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
};

const imageTypes: SupportedCoverImage[] = [
  { extension: 'png', mimeType: 'image/png' },
  { extension: 'jpg', mimeType: 'image/jpeg' },
  { extension: 'webp', mimeType: 'image/webp' },
];

export function detectCoverImageType(bytes: Buffer): SupportedCoverImage | null {
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return imageTypes[0];
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return imageTypes[1];
  }
  if (
    bytes.length >= 12 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return imageTypes[2];
  }
  return null;
}

export function decodeLegacyCoverDataUrl(
  value: string,
): ({ bytes: Buffer } & SupportedCoverImage) | null {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return null;

  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.toString('base64') !== match[2]) return null;
  const detectedType = detectCoverImageType(bytes);
  if (!detectedType || detectedType.mimeType !== match[1]) return null;
  return { bytes, ...detectedType };
}

export function isManagedFarmCoverPath(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^farm-covers\/[A-Za-z0-9_-]+\.(?:jpg|png|webp)$/.test(value);
}
