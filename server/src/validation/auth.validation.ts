import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(6, { message: "Password must be at least 6 characters long" })
  .regex(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter",
  })
  .regex(/[0-9]/, { message: "Password must contain at least one number" })
  .regex(/[^A-Za-z0-9]/, {
    message: "Password must contain at least one special character",
  });

export const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .min(1)
  .max(255);

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
