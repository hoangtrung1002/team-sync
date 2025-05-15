import { Router } from "express";
import {
  createTaskController,
  deleteTaskController,
  getAllTasksController,
  getTaskByIdController,
  updateTaskController,
} from "../controllers/task.controller";

const taskRoute = Router();

taskRoute.post("/:projectId/:workspaceId/create", createTaskController);
taskRoute.put("/:id/:projectId/:workspaceId/update", updateTaskController);
taskRoute.get("/:workspaceId/all", getAllTasksController);
taskRoute.get("/:id/:projectId/:workspaceId/", getTaskByIdController);
taskRoute.delete("/:id/:workspaceId/delete", deleteTaskController);

export default taskRoute;
