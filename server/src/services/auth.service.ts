import mongoose from "mongoose";
import { Roles } from "../enums/role.enum";
import AccountModel, { AccountDocument } from "../models/account.model";
import MemberModel from "../models/member.model";
import RoleModel from "../models/role-permission.model";
import UserModel, { UserDocument } from "../models/user.model";
import WorkspaceModel from "../models/workspace.model";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../utils/app-error";
import { ProviderEnum } from "../enums/account-provider.enum";
import { compareValue } from "../utils/bcrypt";

export async function loginInOrCreateAccountService(data: {
  provider: string;
  displayName: string;
  providerId: string;
  picture?: string;
  email?: string;
}) {
  const { provider, displayName, providerId, picture, email } = data;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    console.log("Started Session...");

    let user = await UserModel.findOne({ email }).session(session);
    if (!user) {
      // Create a new user if it doesn't exist
      user = new UserModel({
        email,
        name: displayName,
        profilePicture: picture || null,
      });
      await user.save({ session });

      const account = new AccountModel({
        userId: user._id,
        provider,
        providerId,
      });
      await account.save({ session });

      // Create a new workspace for the new user
      const workspace = new WorkspaceModel({
        name: "My Workspace",
        description: `Workspace created for ${user.name}`,
        owner: user._id,
      });
      await workspace.save({ session });

      const ownerRole = await RoleModel.findOne({ name: Roles.OWNER }).session(
        session
      );
      if (!ownerRole) {
        throw new NotFoundException("Owner role not found");
      }
      // Create a member for a new workspace
      const member = new MemberModel({
        userId: user._id,
        workspaceId: workspace._id,
        role: ownerRole._id,
        joinedAt: new Date(),
      });
      await member.save({ session });

      user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
      await user.save({ session });
    }
    await session.commitTransaction();
    session.endSession();
    console.log("End Session...");
    return { user };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function registerUserService(body: {
  email: string;
  name: string;
  password: string;
}) {
  const { email, name, password } = body;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const existingUser = await UserModel.findOne({ email }).session(session);
    if (existingUser) throw new BadRequestException("Email Already Exists");

    const user = new UserModel({
      name,
      email,
      password,
    });
    await user.save({ session });

    const account = new AccountModel({
      userId: user._id,
      provider: ProviderEnum.EMAIL,
      providerId: email,
    });
    await account.save({ session });

    const workspace = new WorkspaceModel({
      name: "My Workspace",
      description: `Workspace created for ${user.name}`,
      owner: user._id,
    });
    await workspace.save({ session });

    const ownerRole = await RoleModel.findOne({ name: Roles.OWNER }).session(
      session
    );
    if (!ownerRole) throw new NotFoundException("Owner role not found");

    const member = new MemberModel({
      userId: user._id,
      workspaceId: workspace._id,
      role: ownerRole._id,
      joinDate: new Date(),
    });
    await member.save({ session });

    user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();
    console.log("End Session...");
    return { userId: user._id, workspaceId: workspace._id };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

export async function verifyUserService({
  email,
  password,
  provider = ProviderEnum.EMAIL,
}: {
  email: string;
  password: string;
  provider?: string;
}) {
  const account: AccountDocument | null = await AccountModel.findOne({
    provider,
    providerId: email,
  });

  if (!account) throw new NotFoundException("Invalid Credential");

  const user: UserDocument | null = await UserModel.findById(account.userId);
  if (!user) throw new NotFoundException("User not found");

  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) throw new UnauthorizedException("Invalid Credential");

  return user.omitPassword();
}
