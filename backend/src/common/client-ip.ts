export function firstHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeIpAddress(value?: string | null) {
  if (!value) return null;

  return value.split(',')[0].trim().replace(/^::ffff:/, '') || null;
}

export function getClientIp(request: any) {
  return (
    normalizeIpAddress(firstHeaderValue(request.headers?.['cf-connecting-ip'])) ||
    normalizeIpAddress(firstHeaderValue(request.headers?.['true-client-ip'])) ||
    normalizeIpAddress(firstHeaderValue(request.headers?.['x-real-ip'])) ||
    normalizeIpAddress(firstHeaderValue(request.headers?.['x-forwarded-for'])) ||
    normalizeIpAddress(request.ip) ||
    normalizeIpAddress(request.socket?.remoteAddress)
  );
}
