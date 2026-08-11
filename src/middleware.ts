import type { MiddlewareHandler } from 'astro';

// @keystatic/astro reads context.locals.runtime.env for Cloudflare credentials.
// @astrojs/cloudflare v14 removed locals.runtime.env (it now throws).
// This shim re-patches it before Keystatic reads it.
export const onRequest: MiddlewareHandler = async (context, next) => {
  if (!import.meta.env.DEV) {
    try {
      const { env } = await import('cloudflare:workers');
      Object.defineProperty(context.locals.runtime, 'env', {
        value: env,
        configurable: true,
      });
    } catch {
      // Not in a Cloudflare Workers runtime; skip
    }
  }
  return next();
};
