export function getRouterBasename(): string {
  const base = import.meta.env.BASE_URL;
  if (!base || base === '/' || base === './') return '';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}
