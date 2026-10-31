import mongoose, { Schema, Types } from "mongoose";

export type UserRole = "seeker" | "employer";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  resumeUrl: string | null;
  profilePictureUrl: string | null;
  skills: string[];
  bio: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["seeker", "employer"],
      default: "seeker",
    },

    resumeUrl: {
      type: String,
      default: null,
    },

    profilePictureUrl: {
      type: String,
      default: null,
    },

    skills: {
      type: [String],
      default: [],
    },

    bio: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;