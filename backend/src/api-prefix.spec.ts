import { ensureGlobalApiPrefix } from './api-prefix';

describe('ensureGlobalApiPrefix', () => {
  it('restores /api when a proxy strips the configured prefix', () => {
    expect(ensureGlobalApiPrefix('/auth/setup-status')).toBe('/api/auth/setup-status');
  });

  it('keeps an existing prefix and query string unchanged', () => {
    expect(ensureGlobalApiPrefix('/api/farms?active=true')).toBe('/api/farms?active=true');
  });
});
