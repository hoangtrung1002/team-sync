import mongoose from "mongoose";
import { Roles } from "../enums/role.enum";
import MemberModel, { MemberDocument } from "../models/member.model";
import RoleModel, { RoleDocument } from "../models/role-permission.model";
import UserModel from "../models/user.model";
import WorkspaceModel, { WorkspaceDocument } from "../models/workspace.model";
import { BadRequestException, NotFoundException } from "../utils/app-error";
import TaskModel from "../models/task.model";
import { TaskStatusEnum } from "../enums/task.enum";
import ProjectModel from "../models/project.model";

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

export async function getMemberWorkspaceService(workspaceId: string) {
  const members = await MemberModel.find({ workspaceId })
    .populate("userId", "name email profilePicture -password")
    .populate("role", "name");

  const roles = await RoleModel.find(
    {},
    { name: 1, _id: 1, permission: 1 }
  ).lean(); // skip the process that the query result is converted from POJO to document Mongoose

  return { members, roles };
}

export async function getWorkspaceAnalyticsService(workspaceId: string) {
  const currentDate = new Date();
  const totalTasks = await TaskModel.countDocuments({
    workspace: workspaceId,
  });
  const overdueTasks = await TaskModel.countDocuments({
    workspace: workspaceId,
    dueDate: { $lt: currentDate },
    status: { $ne: TaskStatusEnum.DONE },
  });

  const completedTasks = await TaskModel.countDocuments({
    workspace: workspaceId,
    status: TaskStatusEnum.DONE,
  });

  const analytics = { totalTasks, overdueTasks, completedTasks };

  return { analytics };
}

export async function changeMemberRoleService(
  workspaceId: string,
  memberId: string,
  roleId: string
) {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) throw new NotFoundException("Workspace does not exist");

  const role = await RoleModel.findById(roleId);
  if (!role) throw new NotFoundException("Role does not exist");

  const member = await MemberModel.findById(memberId);
  if (!member) throw new Error("Member does not exist");

  member.role = role;
  await member.save();
  return { member };
}

export async function updateWorkspaceService(
  workspaceId: string,
  data: { name: string; description?: string }
) {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) throw new NotFoundException("Workspace does not exist");

  workspace.name = data.name || workspace.name;
  workspace.description = data.description || workspace.description;
  await workspace.save();

  return { workspace };
}

export async function deleteWorkspaceService(
  workspaceId: string,
  userId: string
) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const workspace = await WorkspaceModel.findById(workspaceId).session(
      session
    );
    if (!workspace) throw new NotFoundException("Workspace does not exist");

    if (workspace.owner.toString() !== userId) {
      throw new BadRequestException("You are not the owner of this workspace");
    }

    const user = await UserModel.findById(userId).session(session);
    if (!user) throw new NotFoundException("User does not exist");

    await ProjectModel.deleteMany({ workspace: workspace._id }).session(
      session
    );
    await TaskModel.deleteMany({ workspace: workspace._id }).session(session);
    await MemberModel.deleteMany({ workspaceId: workspace._id }).session(
      session
    );
    // update the user's current workspace if it is the one being deleted
    if (user?.currentWorkspace?.equals(workspace._id)) {
      const memberWorkspace = await MemberModel.findOne({ userId }).session(
        session
      );
      user.currentWorkspace = memberWorkspace
        ? memberWorkspace.workspaceId
        : null;
      await user.save({ session });
    }
    await workspace.deleteOne({ session });
    await session.commitTransaction();
    session.endSession();

    return { currentWorkspace: user.currentWorkspace };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}
