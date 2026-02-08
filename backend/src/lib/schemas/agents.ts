import { z } from "zod";

const NAME_MIN = 1;
const NAME_MAX = 50;

export const registerAgentBodySchema = z.object({
  name: z
    .string()
    .min(NAME_MIN, "name is required")
    .max(NAME_MAX, `name must be at most ${NAME_MAX} characters`)
    .transform((s) => s.trim())
    .refine((s) => s.length >= NAME_MIN, "name is required"),
});

export type RegisterAgentBody = z.infer<typeof registerAgentBodySchema>;
