import { Request, Response } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { Permissions } from "../enums/role.enum";
import { asyncHandler } from "../middlewares/asynHandler.middleware";
import { getMemberRoleInWorkspace } from "../services/member.service";
import {
  changeMemberRoleService,
  createWorkspaceService,
  deleteWorkspaceService,
  getMemberWorkspaceService,
  getUserWorkspacesService,
  getWorkspaceAnalyticsService,
  getWorkspaceByIdService,
  updateWorkspaceService,
} from "../services/workspace.service";
import roleGuard from "../utils/roleGuard";
import {
  changeRoleSchema,
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceIdSchema,
} from "../validation/workspace.validation";

export const createWorkspaceController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = createWorkspaceSchema.parse(req.body);
    const userId = req.user?._id;
    const { workspace } = await createWorkspaceService(userId, body);
    return res.status(HTTPSTATUS.CREATED).json({
      message: "Workspace created successfully",
      workspace,
    });
  }
);

export const getUserWorkspacesController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { workspaces } = await getUserWorkspacesService(userId);
    return res.status(HTTPSTATUS.OK).json({
      message: "Workspace fetched successfully",
      workspaces,
    });
  }
);

export const getWorkspaceByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);
    const userId = req.user?._id;

    await getMemberRoleInWorkspace(userId, workspaceId);

    const { workspace } = await getWorkspaceByIdService(workspaceId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Workspace fetched successfully",
      workspace,
    });
  }
);

export const getMemberWorkspaceController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);
    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const { members, roles } = await getMemberWorkspaceService(workspaceId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Member workspace fetched successfully",
      members,
      roles,
    });
  }
);

export const getWorkspaceAnalyticsController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);
    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const { analytics } = await getWorkspaceAnalyticsService(workspaceId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Workspace analytics fetched successfully",
      analytics,
    });
  }
);

export const changeWorkspaceMemberRoleController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);
    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.CHANGE_MEMBER_ROLE]);

    const { memberId, roleId } = changeRoleSchema.parse(req.body);
    const { member } = await changeMemberRoleService(
      workspaceId,
      memberId,
      roleId
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Member role changed successfully",
      member,
    });
  }
);

export const updateWorkspaceController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);
    const data = updateWorkspaceSchema.parse(req.body);

    const userId = req.user?._id;
    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_WORKSPACE]);

    const { workspace } = await updateWorkspaceService(workspaceId, data);

    return res.status(HTTPSTATUS.OK).json({
      message: "Workspace updated successfully",
      workspace,
    });
  }
);

export const deleteWorkspaceController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);
    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.DELETE_WORKSPACE]);

    const { currentWorkspace } = await deleteWorkspaceService(
      workspaceId,
      userId
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Workspace deleted successfully",
      currentWorkspace,
    });
  }
);
