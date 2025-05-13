import { Router } from "express";
import {
  createProjectController,
  deleteProjectController,
  getAllProjectController,
  getProjectAnalyticsController,
  getProjectByIdController,
  updateProjectController,
} from "../controllers/project.controller";

const projectRoute = Router();

projectRoute.post("/:workspaceId/create", createProjectController);
projectRoute.get("/:workspaceId/all", getAllProjectController);
projectRoute.get("/:id/:workspaceId/", getProjectByIdController);
projectRoute.get("/:id/:workspaceId/analytics", getProjectAnalyticsController);
projectRoute.put("/:id/:workspaceId/update", updateProjectController);
projectRoute.delete("/:id/:workspaceId/delete", deleteProjectController);

export default projectRoute;
