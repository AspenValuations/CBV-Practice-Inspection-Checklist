import { z } from "zod";

// z.coerce.boolean() uses Boolean(x), which makes "false" → true. Use a
// preprocess that recognises the common string forms instead.
const envBool = z.preprocess((v) => {
  if (typeof v === "boolean") return v;
  if (typeof v !== "string") return v;
  const norm = v.trim().toLowerCase();
  if (norm === "true" || norm === "1" || norm === "yes" || norm === "on") return true;
  if (norm === "false" || norm === "0" || norm === "no" || norm === "off" || norm === "") return false;
  return v;
}, z.boolean());

const envSchema = z.object({
  SMTP_HOST: z.string().min(1).default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_SECURE: envBool.optional(),
  SMTP_USER: z.string().email(),
  SMTP_PASS: z.string().min(1),
  EMAIL_FROM: z.string().min(1).optional(),
  SMTP_POOL: envBool.default(false),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(
      `Missing required environment variables:\n${result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")}`,
    );
  }
  return result.data;
}

export const env = parseEnv();
