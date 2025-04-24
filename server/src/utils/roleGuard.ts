import { PermissionType } from "../enums/role.enum";
import { UnauthorizedException } from "./app-error";
import { RolePermissions } from "./role-permission";

function roleGuard(
  role: keyof typeof RolePermissions,
  requiredPermissions: PermissionType[]
) {
  const permissions = RolePermissions[role];
  const validPermissions = requiredPermissions.every((permission) =>
    permissions.includes(permission)
  );
  if (!validPermissions)
    throw new UnauthorizedException(
      "You don't have the necessary permissions to perform this action"
    );
}

export default roleGuard;
