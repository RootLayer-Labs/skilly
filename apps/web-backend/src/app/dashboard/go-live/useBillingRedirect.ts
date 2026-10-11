"use client";

import { useState } from "react";
import type { BillingPlanOption } from "../BillingCard";

function redirectToBillingUrl(data: unknown): boolean {
  if (data && typeof data === "object" && "url" in data && typeof data.url === "string" && data.url) {
    window.location.href = data.url;
    return true;
  }
  return false;
}

function billingError(data: unknown, fallback: string): Error {
  return new Error(data && typeof data === "object" && "error" in data && typeof data.error === "string"
    ? data.error
    : fallback);
}

async function requestCheckout(plan: BillingPlanOption["id"]): Promise<void> {
  const response = await fetch("/api/web/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  const data: unknown = await response.json();
  if (!redirectToBillingUrl(data)) throw billingError(data, "Checkout is unavailable.");
}

async function requestPortal(): Promise<void> {
  const response = await fetch("/api/web/portal", { method: "POST" });
  const data: unknown = await response.json();
  if (redirectToBillingUrl(data)) return;
  if (data && typeof data === "object" && "fallback" in data && data.fallback === "checkout") {
    await requestCheckout("starter");
    return;
  }
  throw billingError(data, "The customer portal is unavailable.");
}

export function useBillingRedirect() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runBillingRequest(request: () => Promise<void>): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await request();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return {
    busy,
    error,
    startCheckout: (plan: BillingPlanOption["id"] = "starter") => runBillingRequest(() => requestCheckout(plan)),
    openPortal: () => runBillingRequest(requestPortal),
  };
}
