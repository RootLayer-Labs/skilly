import { describe, expect, test } from "bun:test";
import { getBillingPlanOptions } from "../src/domain/billing";

describe("billing plan options", () => {
  test("exposes the three public plan choices without provider product IDs", () => {
    const plans = getBillingPlanOptions({
      POLAR_BUILDER_STARTER_PRODUCT_ID: "provider_starter",
      POLAR_BUILDER_STUDIO_PRODUCT_ID: "provider_studio",
      POLAR_BUILDER_SCALE_PRODUCT_ID: "provider_scale",
    });
    expect(plans).toEqual([
      { id: "starter", name: "Starter", priceMonthly: 29, minutes: 400, capSeconds: 24_000, description: "For one early product surface." },
      { id: "studio", name: "Studio", priceMonthly: 99, minutes: 1_500, capSeconds: 90_000, description: "For active product onboarding." },
      { id: "scale", name: "Scale", priceMonthly: 299, minutes: 5_000, capSeconds: 300_000, description: "For higher-volume support flows." },
    ]);
    expect(plans.every((plan) => !("productId" in plan))).toBe(true);
  });

  test("uses environment caps and keeps the existing legacy Starter cap fallback", () => {
    expect(getBillingPlanOptions({
      POLAR_BUILDER_STARTER_CAP_SECONDS: "30001.2",
      POLAR_BUILDER_STUDIO_CAP_SECONDS: "120000",
      POLAR_BUILDER_SCALE_CAP_SECONDS: "400000",
    }).map((plan) => plan.capSeconds)).toEqual([30_001, 120_000, 400_000]);
    expect(getBillingPlanOptions({ POLAR_PLAN_CAP_SECONDS: "45000" })[0]?.capSeconds).toBe(45_000);
    expect(getBillingPlanOptions({ POLAR_BUILDER_STARTER_CAP_SECONDS: "-1" })[0]?.capSeconds).toBe(24_000);
  });
});
