import mongoose from "mongoose";
import ProjectModel from "../models/project.model";
import TaskModel from "../models/task.model";
import { NotFoundException } from "../utils/app-error";
import { TaskStatusEnum } from "../enums/task.enum";

export async function createProjectService(
  userId: string,
  workspaceId: string,
  data: { emoji?: string; name: string; description?: string }
) {
  const project = new ProjectModel({
    ...(data.emoji && { emoji: data.emoji }),
    name: data.name,
    description: data.description,
    workspace: workspaceId,
    createdBy: userId,
  });
  await project.save();
  return { project };
}

export async function getAllProjectService(
  workspaceId: string,
  pageSize: number,
  pageNumber: number
) {
  const totalCount = await ProjectModel.countDocuments({
    workspace: workspaceId,
  });

  const skip = (pageNumber - 1) * pageSize;

  const projects = await ProjectModel.find({ workspace: workspaceId })
    .skip(skip)
    .limit(pageSize)
    .populate("createdBy", "_id name profilePicture -password")
    .sort({ createdAt: -1 });

  const totalPages = Math.ceil(totalCount / pageSize);

  return { projects, totalCount, totalPages, skip };
}

export async function getProjectByIdService(
  workspaceId: string,
  projectId: string
) {
  const project = await ProjectModel.findOne({
    _id: projectId,
    workspace: workspaceId,
  }).select("_id emoji name description");

  if (!project)
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );

  return { project };
}

export async function getProjectAnalyticsService(
  workspaceId: string,
  projectId: string
) {
  const project = await ProjectModel.findById(projectId);
  const currentDate = new Date();

  if (!project || project.workspace.toString() !== workspaceId)
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );

  /* aggregate - is a method used to run aggregation pipelines — a sequence of steps (called "stages")
     that transform the documents in a collection. 
  */
  const taskAnalytics = await TaskModel.aggregate([
    {
      $match: { project: new mongoose.Types.ObjectId(projectId) },
    },
    {
      // $facet - Allows you to run multiple aggregation pipelines in parallel on the same input data.
      $facet: {
        totalTasks: [{ $count: "count" }],
        overdueTasks: [
          {
            $match: {
              dueDate: { $lt: currentDate },
              status: { $ne: TaskStatusEnum.DONE },
            },
          },
          { $count: "count" },
        ],
        completeTasks: [
          { $match: { status: TaskStatusEnum.DONE } },
          { $count: "count" },
        ],
      },
    },
  ]);

  const _analytics = taskAnalytics[0];
  const analytics = {
    totalTasks: _analytics.totalTasks[0]?.count || 0,
    overdueTasks: _analytics.overdueTasks[0]?.count || 0,
    completeTasks: _analytics.completeTasks[0]?.count || 0,
  };

  return { analytics };
}

export async function updateProjectService(
  workspaceId: string,
  projectId: string,
  data: { emoji?: string; name: string; description?: string }
) {
  const { emoji, name, description } = data;
  const project = await ProjectModel.findOne({
    _id: projectId,
    workspace: workspaceId,
  });

  if (!project)
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );

  if (emoji) project.emoji = emoji;
  if (name) project.name = name;
  if (description) project.description = description;
  await project.save();

  return { project };
}

export async function deleteProjectService(
  workspaceId: string,
  projectId: string
) {
  const project = await ProjectModel.findOne({
    _id: projectId,
    workspace: workspaceId,
  });

  if (!project)
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );

  await ProjectModel.deleteOne();
  await TaskModel.deleteMany({ project: project._id });

  return project;
}
