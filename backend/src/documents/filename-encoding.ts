export function decodeUploadFilename(filename: string): string {
  const decoded = Buffer.from(filename, 'latin1').toString('utf8');
  return /[\u0000-\u001f\u007f-\u009f]|\ufffd/.test(decoded) ? filename : decoded;
}
