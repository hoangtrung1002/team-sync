import { ErrorCodeEnum } from "../enums/error-code.enum";
import MemberModel, { MemberDocument } from "../models/member.model";
import WorkspaceModel from "../models/workspace.model";
import { NotFoundException, UnauthorizedException } from "../utils/app-error";

export async function getMemberRoleInWorkspace(
  userId: string,
  workspaceId: string
) {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) throw new NotFoundException("Workspace does not exist");

  const member: MemberDocument = await MemberModel.findOne({
    userId,
    workspaceId,
  }).populate("role");
  if (!member)
    throw new UnauthorizedException(
      "You're not a member of this workspace",
      ErrorCodeEnum.ACCESS_UNAUTHORIZED
    );

  const roleName = member.role.name;
  return { role: roleName };
}
