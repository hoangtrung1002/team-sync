import mongoose, { Document, Schema } from "mongoose";
import {
  PermissionType,
  RoleType,
  Permissions,
  Roles,
} from "../enums/role.enum";
import { RolePermissions } from "../utils/role-permission";

export interface RoleDocument extends Document {
  name: RoleType;
  permissions: Array<PermissionType>;
}

const RoleSchema = new Schema<RoleDocument>(
  {
    name: {
      type: String,
      enum: Object.values(Roles),
      required: true,
      unique: true,
    },
    permissions: [
      {
        type: [String],
        enum: Object.values(Permissions),
        required: true,
        default: function (this: RoleDocument) {
          return RolePermissions[this.name];
        },
      },
    ],
  },
  { timestamps: true }
);

const RoleModel =
  mongoose.models.Role || mongoose.model<RoleDocument>("Role", RoleSchema);
export default RoleModel;
