import { Request, Response } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { Permissions } from "../enums/role.enum";
import { asyncHandler } from "../middlewares/asynHandler.middleware";
import { getMemberRoleInWorkspace } from "../services/member.service";
import {
  createProjectService,
  getAllProjectService,
} from "../services/project.service";
import roleGuard from "../utils/roleGuard";
import { createProjectSchema } from "../validation/project.validation";
import { workspaceIdSchema } from "../validation/workspace.validation";

export const createProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = createProjectSchema.parse(req.body);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const userId = req.user?._id;
    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.CREATE_PROJECT]);

    const { project } = await createProjectService(userId, workspaceId, data);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Project created successfully",
      project,
    });
  }
);

export const getAllProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;

    const { projects, skip, totalCount, totalPages } =
      await getAllProjectService(workspaceId, pageSize, pageNumber);

    return res.status(HTTPSTATUS.OK).json({
      message: "Projects fetched successfully",
      projects,
      pagination: {
        totalCount,
        pageSize,
        pageNumber,
        totalPages,
        skip,
        limit: pageSize,
      },
    });
  }
);
