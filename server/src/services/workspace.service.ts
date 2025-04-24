import mongoose from "mongoose";
import { Roles } from "../enums/role.enum";
import MemberModel, { MemberDocument } from "../models/member.model";
import RoleModel, { RoleDocument } from "../models/role-permission.model";
import UserModel from "../models/user.model";
import WorkspaceModel, { WorkspaceDocument } from "../models/workspace.model";
import { NotFoundException } from "../utils/app-error";

export async function createWorkspaceService(
  userId: string,
  body: { name: string; description?: string | undefined }
) {
  const { name, description } = body;
  const user = await UserModel.findById(userId);
  if (!user) throw new NotFoundException("User not found");

  const ownerRole = await RoleModel.findOne({ name: Roles.OWNER });
  if (!ownerRole) throw new NotFoundException("Owner role not found");

  const workspace = new WorkspaceModel({
    name,
    description,
    owner: user._id,
  });
  await workspace.save();

  const member = new MemberModel({
    userId: user._id,
    workspaceId: workspace._id,
    role: ownerRole._id,
    joinDate: new Date(),
  });
  await member.save();

  user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
  await user.save();

  return { workspace };
}

export async function getUserWorkspacesService(userId: string) {
  const members = await MemberModel.find({ userId })
    .populate("workspaceId")
    .select("-password")
    .exec();

  const workspaces = members.map(
    (member) => member.workspaceId as WorkspaceDocument
  );

  return { workspaces };
}

export async function getWorkspaceByIdService(workspaceId: string) {
  const workspace = await WorkspaceModel.findById(workspaceId);

  if (!workspace) throw new NotFoundException("Workspace does not exist");

  const members = await MemberModel.find({
    workspaceId,
  }).populate("role");

  const workspaceWithMembers = {
    // converts the Mongoose document into a plain JavaScript object,
    ...workspace.toObject(),
    members,
  };
  return { workspace: workspaceWithMembers };
}
