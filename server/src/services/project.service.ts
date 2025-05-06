import ProjectModel from "../models/project.model";

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
