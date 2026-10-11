import { describe, expect, test } from "bun:test";
import { MemoryRepo } from "@/db/memoryRepo";

describe("listTenantSignups", () => {
  test("reports each tenant's signup date and latest Polar state", async () => {
    const repo = new MemoryRepo();
    const created = await repo.createTenant({ name: "Northpeak" });
    const before = (await repo.listTenantSignups()).find((signup) => signup.tenantId === created.id);
    expect(before?.createdAt).toBeInstanceOf(Date);
    expect(before?.providerState).toBeNull();

    await repo.applyTenantBillingEvent({ eventId: "evt_1", tenantId: created.id, capSeconds: 24_000, providerEventAt: new Date().toISOString(), providerState: "active" });
    const after = (await repo.listTenantSignups()).find((signup) => signup.tenantId === created.id);
    expect(after?.providerState).toBe("active");
  });
});
