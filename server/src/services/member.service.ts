import { ErrorCodeEnum } from "../enums/error-code.enum";
import { Roles } from "../enums/role.enum";
import MemberModel, { MemberDocument } from "../models/member.model";
import RoleModel from "../models/role-permission.model";
import WorkspaceModel from "../models/workspace.model";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../utils/app-error";

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

export async function joinWorkspaceByInvite(
  userId: string,
  inviteCode: string
) {
  const workspace = await WorkspaceModel.findOne({
    inviteCode,
  });
  if (!workspace)
    throw new NotFoundException(
      "Invalid invite code or workspace does not exist"
    );

  const existingMember = await MemberModel.findOne({
    userId,
    workspaceId: workspace._id,
  }).exec();
  if (existingMember)
    throw new BadRequestException("You already a member of this workspace");

  const role = await RoleModel.findOne({ name: Roles.MEMBER });
  if (!role) throw new NotFoundException("Role does not exist");

  const newMember = new MemberModel({
    userId,
    workspaceId: workspace._id,
    role: role._id,
  });
  await newMember.save();

  return { workspaceId: workspace._id, role: role.name };
}
