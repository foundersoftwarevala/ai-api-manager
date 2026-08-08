import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const healthSchema = z.object({
  serviceIds: z.array(z.string().uuid()).max(60).optional(),
});

const modelTestSchema = z.object({
  modelRowId: z.string().uuid(),
  prompt: z.string().min(1).max(2000),
});

export const runHealthChecks = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => healthSchema.parse(data ?? {}))
  .handler(async ({ data }) => {
    const { runHealthChecksImpl } = await import("./manager-ops.server");
    return runHealthChecksImpl(data.serviceIds);
  });

export const runModelTest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => modelTestSchema.parse(data))
  .handler(async ({ data }) => {
    const { runModelTestImpl } = await import("./manager-ops.server");
    return runModelTestImpl(data);
  });
