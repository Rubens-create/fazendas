import { decodeUploadFilename } from './filename-encoding';

describe('decodeUploadFilename', () => {
  it('recovers UTF-8 filename bytes parsed as latin1', () => {
    expect(decodeUploadFilename('4. PROCURAÃ\u0087Ã\u0083O OUTORGADO NILVA.pdf')).toBe(
      '4. PROCURAÇÃO OUTORGADO NILVA.pdf',
    );
  });

  it('preserves ASCII and already-decoded Unicode filenames', () => {
    expect(decodeUploadFilename('documento.pdf')).toBe('documento.pdf');
    expect(decodeUploadFilename('Procuração.pdf')).toBe('Procuração.pdf');
  });
});
