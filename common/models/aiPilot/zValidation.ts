import { z } from "zod";

export const zAiPilotModel = z.object({
  id: z.string().min(1),
  vendor: z.string().min(1, "Vendor is required"),
  modelName: z.string().min(1, "Model name is required"),
  tokenMultiplier: z
    .number()
    .min(0.01, "Token multiplier must be at least 0.01")
    .max(10, "Token multiplier must be less than 10"),
  isDefault: z.boolean().optional(),
});
