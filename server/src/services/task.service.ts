import { z } from "zod";
import {
  TaskPriorityEnum,
  TaskPriorityEnumType,
  TaskStatusEnum,
  TaskStatusEnumType,
} from "../enums/task.enum";
import MemberModel from "../models/member.model";
import ProjectModel from "../models/project.model";
import TaskModel, { Task } from "../models/task.model";
import { BadRequestException, NotFoundException } from "../utils/app-error";
import {
  createTaskSchema,
  updateTaskSchema,
} from "../validation/task.validation";

export async function createTaskService(
  projectId: string,
  workspaceId: string,
  userId: string,
  data: z.infer<typeof createTaskSchema>
): Promise<{ task: Task }> {
  const { title, description, assignedTo, priority, status, dueDate } = data;

  const project = await ProjectModel.findById(projectId);
  if (!project)
    throw new NotFoundException(
      "Project not found or does not belong to the workspace"
    );
  if (assignedTo) {
    const isMember = await MemberModel.findOne({
      userId: assignedTo,
      workspaceId,
    });
    if (!isMember)
      throw new Error("This user is not a member of the workspace");
  }

  const task = new TaskModel({
    title,
    description,
    assignedTo,
    priority: priority || TaskPriorityEnum.MEDIUM,
    status: status || TaskStatusEnum.TODO,
    dueDate,
    project: projectId,
    workspace: workspaceId,
    createdBy: userId,
  });
  await task.save();

  return { task };
}

export async function updateTaskService(
  workspaceId: string,
  projectId: string,
  taskId: string,
  data: z.infer<typeof updateTaskSchema>
): Promise<{ updatedTask: Task }> {
  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const task = await TaskModel.findById(taskId);

  if (!task || task.project.toString() !== projectId.toString()) {
    throw new NotFoundException(
      "Task not found or does not belong to this project"
    );
  }

  const updatedTask = await TaskModel.findByIdAndUpdate(
    taskId,
    {
      ...data,
    },
    { new: true }
  );

  if (!updatedTask) {
    throw new BadRequestException("Failed to update task");
  }

  return { updatedTask };
}

export async function getAllTasksService(
  workspaceId: string,
  filters: {
    projectId?: string;
    status?: string[];
    priority?: string[];
    assignedTo?: string[];
    keyword?: string;
    dueDate?: string;
  },
  pagination: { pageSize: number; pageNumber: number }
) {
  const query: Record<string, any> = {
    workspace: workspaceId,
  };

  if (filters.projectId) {
    query.project = filters.projectId;
  }

  if (filters.status && filters.status.length > 0) {
    query.status = { $in: filters.status };
  }
  if (filters.priority && filters.priority.length > 0) {
    query.priority = { $in: filters.priority };
  }
  if (filters.assignedTo && filters.assignedTo.length > 0) {
    query.assignedTo = { $in: filters.assignedTo };
  }
  if (filters.keyword && filters.keyword !== undefined) {
    query.title = { $regex: filters.keyword, $options: "i" };
  }
  if (filters.dueDate) {
    query.dueDate = { $eq: new Date(filters.dueDate) };
  }

  const { pageNumber, pageSize } = pagination;
  const skip = (pageNumber - 1) * pageSize;

  const [tasks, totalCount] = await Promise.all([
    TaskModel.find(query)
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 })
      .populate("assignedTo", "_id name profilePicture -password")
      .populate("project", "_id emoji name"),
    TaskModel.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    tasks,
    pagination: { totalCount, totalPages, pageNumber, pageSize, skip },
  };
}

export async function getTaskByIdService(
  workspaceId: string,
  projectId: string,
  taskId: string
) {
  const project = await ProjectModel.findById(projectId);
  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const task = await TaskModel.findOne({
    _id: taskId,
    project: projectId,
    workspace: workspaceId,
  }).populate("assignedTo", "_id name profilePicture -password");

  if (!task) {
    throw new Error("Task not found");
  }

  return task;
}

export async function deleteTaskService(workspaceId: string, taskId: string) {
  const task = await TaskModel.findOneAndDelete({
    _id: taskId,
    workspace: workspaceId,
  });

  if (!task)
    throw new NotFoundException(
      "Task not found or does not belong to this workspace"
    );

  return;
}
