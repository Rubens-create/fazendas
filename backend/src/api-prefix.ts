export function ensureGlobalApiPrefix(url: string): string {
  if (url === '/api' || url.startsWith('/api/')) return url;
  return `/api${url.startsWith('/') ? '' : '/'}${url}`;
}
