import client from "./client";
import type { Application, Job, User, EmployerCompanyProfile, } from "../types";


export const authApi = {
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: "seeker" | "employer";
  }) => client.post<{ token: string; user: User }>("/auth/register", payload),
  login: (payload: { email: string; password: string }) =>
    client.post<{ token: string; user: User }>("/auth/login", payload),
  me: () => client.get<{ user: User }>("/auth/me"),
  updateProfile: (payload: {
    name?: string;
    bio?: string;
    skills?: string[];
  }) => client.patch<{ user: User; message: string }>("/auth/profile", payload),
  employerProfile: () =>
  client.get<{
    success: boolean;
    profile: EmployerCompanyProfile;
  }>("/auth/employer-profile"),

updateEmployerProfile: (
  payload: Partial<EmployerCompanyProfile>
) =>
  client.patch<{
    success: boolean;
    message: string;
    profile: EmployerCompanyProfile;
  }>("/auth/employer-profile", payload),
};
export interface JobFilters {
  search?: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  page?: number;
  limit?: number;
}
export const jobApi = {
  list: (params: JobFilters = {}) =>
    client.get<{
      jobs: Job[];
      totalJobs: number;
      totalPages: number;
      currentPage: number;
    }>("/jobs", { params }),
  mine: () => client.get<{ jobs: Job[]; count: number }>("/jobs/my-jobs"),
  create: (payload: Partial<Job>) =>
    client.post<{ job: Job; message: string }>("/jobs", payload),
  update: (id: string, payload: Partial<Job>) =>
    client.patch<{ job: Job; message: string }>(`/jobs/${id}`, payload),
  remove: (id: string) => client.delete<{ message: string }>(`/jobs/${id}`),
};
export const applicationApi = {
  apply: (payload: { jobId: string; resume: string; coverLetter?: string }) =>
    client.post("/applications", payload),
  mine: () =>
    client.get<{ applications: Application[]; count: number }>(
      "/applications/my-applications",
    ),
  forJob: (jobId: string) =>
    client.get<{ applications: Application[]; count: number }>(
      `/applications/job/${jobId}`,
    ),
  updateStatus: (id: string, status: Application["status"]) =>
    client.patch(`/applications/${id}/status`, { status }),
};
export const uploadApi = {
  resume: (file: File) => {
    const data = new FormData();
    data.append("resume", file);
    return client.post<{ resume: { url: string }; user: User }>(
      "/uploads/resume",
      data,
    );
  },
  profilePicture: (file: File) => {
    const data = new FormData();
    data.append("profilePicture", file);
    return client.post<{ profilePicture: { url: string }; user: User }>(
      "/uploads/profile-picture",
      data,
    );
  },
  companyLogo: (file: File) => {
  const data = new FormData();
  data.append("companyLogo", file);

  return client.post<{
    success: boolean;
    message: string;
    logoUrl: string;
  }>("/uploads/company-logo", data);
},
};
export const aiApi = {
  chat: (
    message: string,
    history: { role: "user" | "assistant"; content: string }[],
  ) =>
    client.post<{ data: { reply: string } }>("/ai/career-chat", {
      message,
      history,
    }),
  analyseResume: (resumeText: string, jobDescription = "") =>
    client.post<{ data: ResumeAnalysis }>("/ai/analyse-resume", {
      resumeText,
      jobDescription,
    }),
  match: (resumeText: string, jobDescription: string) =>
    client.post<{ data: JobMatch }>("/ai/job-match-score", {
      resumeText,
      jobDescription,
    }),
  coverLetter: (payload: {
    resumeText: string;
    jobTitle: string;
    companyName: string;
    jobDescription?: string;
  }) =>
    client.post<{ data: { coverLetter: string } }>(
      "/ai/generate-cover-letter",
      payload,
    ),
};
export interface ResumeAnalysis {
  summary: string;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  technicalSkills: string[];
  missingSkills: string[];
  atsKeywords: string[];
  improvements: string[];
}
export interface JobMatch {
  matchScore: number;
  matchLevel: string;
  matchedSkills: string[];
  missingSkills: string[];
  relevantExperience: string[];
  recommendations: string[];
  explanation: string;
}
