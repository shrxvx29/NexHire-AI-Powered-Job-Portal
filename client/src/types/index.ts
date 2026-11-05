export type UserRole = 'seeker' | 'employer';
export type JobType = 'Full-Time' | 'Part-Time' | 'Internship' | 'Contract';
export type ExperienceLevel = 'Fresher' | 'Entry-level' | 'Mid-level' | 'Senior';
export type ApplicationStatus = 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted';
export interface User { _id?: string; id?: string; name: string; email: string; role: UserRole; resumeUrl?: string | null; profilePictureUrl?: string | null; skills: string[]; bio: string; createdAt?: string; }
export interface Job { _id: string; title: string; company: string; location: string; description: string; salary?: string; jobType: JobType; experienceLevel: ExperienceLevel; skills: string[]; createdBy: string | { _id: string; name: string }; isActive: boolean; createdAt: string; }
export interface Application { _id: string; job: Job | string; applicant: User | string; resume: string; coverLetter: string; status: ApplicationStatus; createdAt: string; }
export interface ApiMessage { success: boolean; message?: string; }
export interface EmployerCompanyProfile {
    name: string;
    email: string;
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