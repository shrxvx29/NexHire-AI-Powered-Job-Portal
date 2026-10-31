import mongoose, { Schema, Types } from "mongoose";
const jobSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    company: {
        type: String,
        required: true,
        trim: true,
    },
    location: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    salary: {
        type: String,
        default: "",
    },
    jobType: {
        type: String,
        enum: ["Full-Time", "Part-Time", "Internship", "Contract"],
        default: "Full-Time",
    },
    experienceLevel: {
        type: String,
        enum: ["Fresher", "Entry-level", "Mid-level", "Senior"],
        default: "Fresher",
    },
    skills: {
        type: [String],
        default: [],
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
const Job = mongoose.model("Job", jobSchema);
export default Job;
//# sourceMappingURL=Job.js.map