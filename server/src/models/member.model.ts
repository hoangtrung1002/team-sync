import mongoose, { Document, Schema } from "mongoose";
import { RoleDocument } from "./role-permission.model";

export interface MemberDocument extends Document {
  userId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  role: RoleDocument;
  joinDate: Date;
}

const MemberSchema = new Schema<MemberDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    role: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    joinDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Member =
  mongoose.models.Member ||
  mongoose.model<MemberDocument>("Member", MemberSchema);
export default Member;
