import { z } from "zod";

export const nameSchema = z
  .string()
  .trim()
  .min(1, { message: "Name is required" })
  .max(255);

export const descriptionSchema = z.string().trim().optional();
export const workspaceIdSchema = z
  .string()
  .trim()
  .min(1, { message: "Workspace ID is required" });
export const changeRoleSchema = z.object({
  memberId: z.string().trim().min(1, { message: "Member ID is required" }),
  roleId: z.string().trim().min(1, { message: "Role ID is required" }),
});
export const createWorkspaceSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
});
export const updateWorkspaceSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
});
