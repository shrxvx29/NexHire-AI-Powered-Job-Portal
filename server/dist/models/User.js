import mongoose, { Schema, Types } from "mongoose";
const userSchema = new Schema({
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
}, {
    timestamps: true,
});
const User = mongoose.model("User", userSchema);
export default User;
//# sourceMappingURL=User.js.map