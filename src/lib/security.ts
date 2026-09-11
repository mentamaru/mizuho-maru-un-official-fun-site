export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline' https://platform.twitter.com https://platform.x.com https://www.instagram.com",
    "connect-src 'self' https://platform.twitter.com https://platform.x.com https://www.instagram.com",
    "font-src 'self' data:",
    "frame-src https://platform.twitter.com https://platform.x.com https://syndication.twitter.com https://www.instagram.com",
    "child-src https://platform.twitter.com https://platform.x.com https://syndication.twitter.com https://www.instagram.com"
  ].join('; '),
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff'
};
