import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { TrpcContext } from './trpc';

export async function createTRPCContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<TrpcContext> {
  let userId: number | undefined;
  let locale: string | undefined;

  // Extract authentication info
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
  const secret = process.env.BACKEND_JWT_SECRET_KEY;

  if (token && secret) {
    try {
      const decoded = jwt.verify(token, secret) as { userId?: number };
      if (decoded && typeof decoded.userId === 'number') {
        userId = decoded.userId;
      }
    } catch (_) {
      // ignore invalid token for public procedures
    }
  }

  // Extract locale from headers
  const acceptLanguage = req.headers['accept-language'];
  const localeHeader = req.headers['x-locale'] as string;

  // Priority: x-locale header > accept-language header > default 'en'
  if (localeHeader && ['en', 'zh'].includes(localeHeader)) {
    locale = localeHeader;
  } else if (acceptLanguage) {
    // Parse accept-language header to extract preferred locale
    const preferredLocale = acceptLanguage.split(',')[0]?.split('-')[0];
    if (preferredLocale && ['en', 'zh'].includes(preferredLocale)) {
      locale = preferredLocale;
    }
  }

  // Default to English if no valid locale found
  if (!locale) {
    locale = 'en';
  }

  return { req, res, userId, locale };
}
