import { Router } from "express";
import {
  createWorkspaceController,
  getMemberWorkspaceController,
  getUserWorkspacesController,
  getWorkspaceByIdController,
} from "../controllers/workspace.controller";

const workspaceRoute = Router();

workspaceRoute.post("/create/new", createWorkspaceController);
workspaceRoute.get("/", getUserWorkspacesController);
workspaceRoute.get("/member/:id", getMemberWorkspaceController);
workspaceRoute.get("/:id", getWorkspaceByIdController);

export default workspaceRoute;
