// Request helpers shared by the route handlers. The widget calls these endpoints
// cross-origin from the tenant's site, so every response reflects CORS headers;
// the real gate is the publishable-key + origin-allowlist check in tenantService.

import type { NextRequest } from "next/server";

/** Extract the publishable key from Authorization: Bearer, x-skilly-key, or ?key=. */
export function extractKey(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }
  const headerKey = request.headers.get("x-skilly-key");
  if (headerKey) {
    return headerKey.trim();
  }
  return request.nextUrl.searchParams.get("key");
}

export function extractOrigin(request: NextRequest): string | null {
  return request.headers.get("origin") ?? request.headers.get("referer") ?? null;
}

/**
 * Where a widget request came from, for the Studio activation funnel. A request
 * whose origin is Studio itself is the in-dashboard preview; any other origin is
 * the customer's own site, which is what "installed" and "live" mean.
 */
export function describeWidgetOrigin(
  request: NextRequest,
  origin: string | null,
): { origin_host: string | null; is_studio_preview: boolean } {
  if (!origin) return { origin_host: null, is_studio_preview: false };
  try {
    const originHost = new URL(origin).host;
    return { origin_host: originHost, is_studio_preview: originHost === request.nextUrl.host };
  } catch {
    return { origin_host: null, is_studio_preview: false };
  }
}

/** Native app id (iOS bundle id / Android package) for mobile SDK requests. */
export function extractAppId(request: NextRequest): string | null {
  return request.headers.get("x-skilly-app-id");
}

/** CORS headers reflecting the request origin (allowlist enforcement is separate). */
export function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Skilly-Key, X-Skilly-App-Id",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
