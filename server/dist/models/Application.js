import mongoose, { Schema, Types } from "mongoose";
const applicationSchema = new Schema({
    job: {
        type: Schema.Types.ObjectId,
        ref: "Job",
        required: true,
    },
    applicant: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    resume: {
        type: String,
        required: true,
    },
    coverLetter: {
        type: String,
        default: "",
    },
    status: {
        type: String,
        enum: [
            "pending",
            "reviewing",
            "shortlisted",
            "rejected",
            "accepted",
        ],
        default: "pending",
    },
}, {
    timestamps: true,
});
// One application per user per job
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
const Application = mongoose.model("Application", applicationSchema);
export default Application;
//# sourceMappingURL=Application.js.map