
import mongoose, { Schema, Types } from "mongoose";

export type UserRole = "seeker" | "employer";

export interface IEmployerCompanyProfile {
  companyName: string;
  logoUrl: string | null;
  website: string;
  industry: string;
  location: string;
  companySize: string;
  description: string;
  recruiterPhone: string;
  linkedinUrl: string;
}

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
  companyProfile: IEmployerCompanyProfile;
  createdAt: Date;
  updatedAt: Date;
}

const companyProfileSchema = new Schema<IEmployerCompanyProfile>(
  {
    companyName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    logoUrl: {
      type: String,
      default: null,
    },
    website: {
      type: String,
      default: "",
      trim: true,
    },
    industry: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },
    location: {
      type: String,
      default: "",
      trim: true,
      maxlength: 150,
    },
    companySize: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    recruiterPhone: {
      type: String,
      default: "",
      trim: true,
      maxlength: 20,
    },
    linkedinUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

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

    companyProfile: {
      type: companyProfileSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
