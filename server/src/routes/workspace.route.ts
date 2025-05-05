import { Router } from "express";
import {
  changeWorkspaceMemberRoleController,
  createWorkspaceController,
  deleteWorkspaceController,
  getMemberWorkspaceController,
  getUserWorkspacesController,
  getWorkspaceAnalyticsController,
  getWorkspaceByIdController,
  updateWorkspaceController,
} from "../controllers/workspace.controller";

const workspaceRoute = Router();

workspaceRoute.post("/create/new", createWorkspaceController);
workspaceRoute.get("/", getUserWorkspacesController);
workspaceRoute.get("/member/:id", getMemberWorkspaceController);
workspaceRoute.get("/analytics/:id", getWorkspaceAnalyticsController);
workspaceRoute.get("/:id", getWorkspaceByIdController);
workspaceRoute.put("/update/:id", updateWorkspaceController);
workspaceRoute.put(
  "/change/member/role/:id",
  changeWorkspaceMemberRoleController
);
workspaceRoute.delete("/delete/:id", deleteWorkspaceController);

export default workspaceRoute;
