import { z } from "zod";
import { tr } from "@/app/i18n";
export const LoginSchema = z.object({
  email: z
    .email({ error: tr("validation.emailInvalid") }),

  password: z
    .string()
    .min(6, { error: tr("validation.passwordMin") })
});
export type LoginSchemaType = z.infer<typeof LoginSchema>;