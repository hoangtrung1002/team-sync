import { Router } from "express";
import {
  createProjectController,
  getAllProjectController,
} from "../controllers/project.controller";

const projectRoute = Router();

projectRoute.post("/:workspaceId/create", createProjectController);
projectRoute.get("/:workspaceId/all", getAllProjectController);

export default projectRoute;
