import {
  decodeLegacyCoverDataUrl,
  detectCoverImageType,
  isManagedFarmCoverPath,
} from './cover-storage';

describe('farm cover storage helpers', () => {
  it('detects supported image types from their binary signatures', () => {
    expect(detectCoverImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toEqual({
      extension: 'png',
      mimeType: 'image/png',
    });
    expect(detectCoverImageType(Buffer.from([0xff, 0xd8, 0xff, 0x00]))).toEqual({
      extension: 'jpg',
      mimeType: 'image/jpeg',
    });
    expect(detectCoverImageType(Buffer.from('RIFF0000WEBP'))).toEqual({
      extension: 'webp',
      mimeType: 'image/webp',
    });
  });

  it('rejects unsupported and empty image data', () => {
    expect(detectCoverImageType(Buffer.from('not an image'))).toBeNull();
    expect(detectCoverImageType(Buffer.alloc(0))).toBeNull();
  });

  it('decodes legacy data URLs only when the declared type matches the bytes', () => {
    const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const dataUrl = `data:image/png;base64,${bytes.toString('base64')}`;
    expect(decodeLegacyCoverDataUrl(dataUrl)).toEqual({
      bytes,
      extension: 'png',
      mimeType: 'image/png',
    });
    expect(decodeLegacyCoverDataUrl(dataUrl.replace('image/png', 'image/jpeg'))).toBeNull();
    expect(decodeLegacyCoverDataUrl('data:image/png;base64,not-base64!')).toBeNull();
  });

  it('accepts only managed relative cover paths', () => {
    expect(isManagedFarmCoverPath('farm-covers/farm-1.webp')).toBe(true);
    expect(isManagedFarmCoverPath('farm-covers/../outside.webp')).toBe(false);
    expect(isManagedFarmCoverPath('/farm-covers/farm-1.webp')).toBe(false);
    expect(isManagedFarmCoverPath('data:image/png;base64,AA==')).toBe(false);
  });
});
