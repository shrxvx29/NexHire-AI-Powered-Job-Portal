
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import {
  UserRound,
  Mail,
  ShieldCheck,
  BriefcaseBusiness,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Camera,
  FileUp,
  Save,
  Loader2,
  ExternalLink,
  Pencil,
  X,
  Code2,
  ArrowUpRight,
  FileText,
  UploadCloud,
  CircleCheck,
  CircleUserRound,
  LockKeyhole,
  ChevronRight,
  Award,
  Plus,
} from "lucide-react";

import toast from "react-hot-toast";

import { uploadApi, authApi } from "../api/services";
import { getApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

const MAX_RESUME_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

const inputClass =
  "w-full rounded-xl border border-border bg-sand-light px-4 py-3.5 text-sm text-ink outline-none transition-all placeholder:text-subtle focus:border-wine focus:ring-4 focus:ring-wine/10 disabled:cursor-not-allowed disabled:bg-sand disabled:text-muted";

function getInitials(name?: string) {
  const trimmed = name?.trim();

  if (!trimmed) return "U";

  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getProfileCompletion(
  name: string,
  bio: string,
  skills: string[],
  resumeUrl?: string | null,
  pictureUrl?: string | null,
) {
  const checks = [
    name.trim().length >= 2,
    bio.trim().length >= 30,
    skills.length > 0,
    Boolean(resumeUrl),
    Boolean(pictureUrl),
  ];

  return Math.round(
    (checks.filter(Boolean).length / checks.length) * 100,
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof UserRound;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-wine-soft text-wine">
        <Icon size={20} />
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-extrabold tracking-[2px] text-wine">
          {eyebrow}
        </p>

        <h2 className="mt-1 font-heading text-lg font-extrabold text-ink sm:text-xl">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-5 text-muted">
          {description}
        </p>
      </div>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-xs font-bold text-ink"
    >
      {children}
      {required && <span className="ml-1 text-danger">*</span>}
    </label>
  );
}

function CompletionRing({ value }: { value: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
      <svg
        viewBox="0 0 84 84"
        className="h-full w-full -rotate-90"
        aria-label={`Profile completion ${value}%`}
      >
        <circle
          cx="42"
          cy="42"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-white/15"
        />

        <circle
          cx="42"
          cy="42"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-sand transition-all duration-700"
        />
      </svg>

      <div className="absolute text-center">
        <p className="font-heading text-xl font-extrabold text-white">
          {value}%
        </p>
        <p className="text-[8px] font-bold tracking-wide text-sand/65">
          COMPLETE
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const pictureInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [skills, setSkills] = useState(
    user?.skills?.join(", ") || "",
  );

  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
    setBio(user?.bio || "");
    setSkills(user?.skills?.join(", ") || "");
  }, [user?.name, user?.bio, user?.skills]);

  const normalizedSkills = useMemo(() => {
    return [
      ...new Map(
        skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
          .map((skill) => [skill.toLowerCase(), skill]),
      ).values(),
    ];
  }, [skills]);

  const completion = getProfileCompletion(
    name,
    bio,
    normalizedSkills,
    user?.resumeUrl,
    user?.profilePictureUrl,
  );

  const isDirty =
    name !== (user?.name || "") ||
    bio !== (user?.bio || "") ||
    skills !== (user?.skills?.join(", ") || "");

  const initials = getInitials(user?.name);

  const missingItems = [
    !name.trim() && "Add your name",
    bio.trim().length < 30 && "Write a professional bio",
    normalizedSkills.length === 0 && "Add your skills",
    !user?.resumeUrl && "Upload your resume",
    !user?.profilePictureUrl && "Add a profile picture",
  ].filter(Boolean) as string[];

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedBio = bio.trim();

    if (trimmedName.length < 2) {
      toast.error("Name must contain at least 2 characters.");
      return;
    }

    if (trimmedName.length > 100) {
      toast.error("Name cannot exceed 100 characters.");
      return;
    }

    if (trimmedBio.length > 1000) {
      toast.error("Bio cannot exceed 1000 characters.");
      return;
    }

    if (normalizedSkills.length > 30) {
      toast.error("You can add a maximum of 30 skills.");
      return;
    }

    try {
      setSaving(true);

      await authApi.updateProfile({
        name: trimmedName,
        bio: trimmedBio,
        skills: normalizedSkills,
      });

      await refreshUser();

      setEditing(false);
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setName(user?.name || "");
    setBio(user?.bio || "");
    setSkills(user?.skills?.join(", ") || "");
    setEditing(false);
  };

  const handleResumeUpload = async (file?: File) => {
    if (!file) return;

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      toast.error("Please select a PDF resume.");
      return;
    }

    if (file.size > MAX_RESUME_SIZE) {
      toast.error("Resume must be smaller than 5 MB.");
      return;
    }

    try {
      setUploadingResume(true);

      await uploadApi.resume(file);
      await refreshUser();

      toast.success("Resume uploaded successfully.");
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setUploadingResume(false);

      if (resumeInputRef.current) {
        resumeInputRef.current.value = "";
      }
    }
  };

  const handlePictureUpload = async (file?: File) => {
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Choose a PNG, JPG or WebP image.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Profile picture must be smaller than 2 MB.");
      return;
    }

    try {
      setUploadingPicture(true);

      await uploadApi.profilePicture(file);
      await refreshUser();

      toast.success("Profile picture updated.");
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setUploadingPicture(false);

      if (pictureInputRef.current) {
        pictureInputRef.current.value = "";
      }
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-7 pb-12">

      {/* PAGE INTRO */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold tracking-[2px] text-wine">
            <CircleUserRound size={14} />
            NEXHIRE / ACCOUNT
          </div>

          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Your profile<span className="text-wine">.</span>
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Manage your identity, professional information and resume
            from one place.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-full border border-border bg-sand-light px-4 py-2 sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-success" />
          <span className="text-[10px] font-bold text-muted">
            Account active
          </span>
        </div>
      </header>

      {/* PROFILE HERO */}
      <section className="relative overflow-hidden rounded-[28px] bg-wine p-6 text-sand-light shadow-wine sm:p-8 lg:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-20 h-72 w-72 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-120px] left-[35%] h-64 w-64 rounded-full bg-white/[0.04] blur-3xl"
        />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {/* AVATAR */}
            <div className="relative h-28 w-28 shrink-0">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[26px] border-[5px] border-white/20 bg-sand text-3xl font-extrabold text-wine shadow-xl">
                {user?.profilePictureUrl ? (
                  <img
                    src={user.profilePictureUrl}
                    alt={`${user?.name || "User"} profile`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              {uploadingPicture && (
                <div className="absolute inset-0 flex items-center justify-center rounded-[26px] bg-ink/60">
                  <Loader2 size={25} className="animate-spin text-white" />
                </div>
              )}

              <button
                type="button"
                onClick={() => pictureInputRef.current?.click()}
                disabled={uploadingPicture}
                aria-label="Change profile picture"
                className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-wine bg-sand text-wine shadow-lg transition hover:scale-105 disabled:opacity-50"
              >
                {uploadingPicture ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Camera size={17} />
                )}
              </button>

              <input
                ref={pictureInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploadingPicture}
                className="hidden"
                onChange={(event) => {
                  void handlePictureUpload(event.target.files?.[0]);
                }}
              />
            </div>

            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[9px] font-extrabold tracking-[1.5px] text-sand">
                  NEXHIRE MEMBER
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 text-[9px] font-extrabold text-wine">
                  <ShieldCheck size={12} />
                  {user?.role === "employer" ? "EMPLOYER" : "JOB SEEKER"}
                </span>
              </div>

              <h2 className="break-words font-heading text-2xl font-extrabold sm:text-3xl">
                {user?.name || "Your name"}
              </h2>

              <p className="mt-2 break-all text-xs text-sand/65 sm:text-sm">
                {user?.email || "Email unavailable"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-lg bg-black/15 px-3 py-2 text-[10px] font-bold text-sand/80">
                  <BriefcaseBusiness size={13} />
                  {user?.role || "Member"} account
                </span>

                <span className="inline-flex items-center gap-2 rounded-lg bg-black/15 px-3 py-2 text-[10px] font-bold text-sand/80">
                  <Mail size={13} />
                  Email registered
                </span>
              </div>
            </div>
          </div>

          {/* COMPLETION RING */}
          <div className="flex items-center gap-5 self-start rounded-2xl border border-white/10 bg-black/10 p-4 sm:self-auto lg:min-w-[245px]">
            <CompletionRing value={completion} />

            <div>
              <p className="text-sm font-extrabold text-white">
                Profile strength
              </p>
              <p className="mt-1 max-w-[130px] text-[10px] leading-5 text-sand/65">
                {completion === 100
                  ? "Your profile is complete."
                  : "A few more details will make your profile stronger."}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-sand">
                <Sparkles size={12} />
                {completion === 100 ? "All set" : "Keep improving"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK STATUS */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-sand-light p-4 shadow-soft">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wine-soft text-wine">
            <Code2 size={18} />
          </div>
          <div>
            <p className="text-xl font-extrabold text-ink">
              {normalizedSkills.length}
            </p>
            <p className="text-[10px] font-semibold text-muted">
              Skills added
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-border bg-sand-light p-4 shadow-soft">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wine-soft text-wine">
            <FileText size={18} />
          </div>
          <div>
            <p className="text-sm font-extrabold text-ink">
              {user?.resumeUrl ? "Uploaded" : "Missing"}
            </p>
            <p className="text-[10px] font-semibold text-muted">
              Resume status
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-border bg-sand-light p-4 shadow-soft">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wine-soft text-wine">
            <Award size={18} />
          </div>
          <div>
            <p className="text-sm font-extrabold text-ink">
              {completion === 100 ? "Complete" : "In progress"}
            </p>
            <p className="text-[10px] font-semibold text-muted">
              Profile status
            </p>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">

        {/* LEFT COLUMN */}
        <div className="min-w-0 space-y-6">

          {/* PERSONAL INFORMATION */}
          <section className="overflow-hidden rounded-[24px] border border-border bg-sand-light shadow-soft">
            <div className="flex flex-col justify-between gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:p-7">
              <SectionTitle
                eyebrow="YOUR DETAILS"
                title="Personal information"
                description="Keep your basic information accurate and up to date."
                icon={UserRound}
              />

              {!editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-wine px-4 py-3 text-xs font-bold text-sand transition hover:bg-wine-dark"
                >
                  <Pencil size={14} />
                  Edit details
                </button>
              )}
            </div>

            <form onSubmit={submit} className="space-y-6 p-5 sm:p-7">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="profile-name" required>
                    Full name
                  </FieldLabel>

                  <input
                    id="profile-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    maxLength={100}
                    disabled={!editing}
                    required
                    className={inputClass}
                  />

                  <p className="mt-1.5 text-right text-[10px] text-muted">
                    {name.length}/100
                  </p>
                </div>

                <div>
                  <FieldLabel htmlFor="profile-email">
                    Email address
                  </FieldLabel>

                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle"
                    />

                    <input
                      id="profile-email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className={`${inputClass} cursor-not-allowed pl-11`}
                    />
                  </div>

                  <p className="mt-1.5 text-[10px] text-muted">
                    <LockKeyhole size={11} className="mr-1 inline" />
                    Email cannot be changed here.
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <FieldLabel htmlFor="profile-bio">
                    Professional bio
                  </FieldLabel>
                  <span className="text-[10px] text-muted">
                    {bio.length}/1000
                  </span>
                </div>

                <textarea
                  id="profile-bio"
                  rows={5}
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Introduce yourself, describe your experience, strengths and career interests..."
                  maxLength={1000}
                  disabled={!editing}
                  className={`${inputClass} min-h-[145px] resize-y leading-6`}
                />

                <p className="mt-2 text-[10px] text-muted">
                  Tip: Mention your current role, technical strengths and the
                  type of opportunities you are looking for.
                </p>
              </div>

              <div>
                <FieldLabel htmlFor="profile-skills">
                  Professional skills
                </FieldLabel>

                <input
                  id="profile-skills"
                  type="text"
                  value={skills}
                  onChange={(event) => setSkills(event.target.value)}
                  placeholder="React, TypeScript, Node.js, MongoDB"
                  disabled={!editing}
                  className={inputClass}
                />

                <p className="mt-2 text-[10px] text-muted">
                  Separate each skill with a comma. Maximum 30 skills.
                </p>

                {normalizedSkills.length > 0 && (
                  <div className="mt-4 rounded-2xl bg-sand p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[10px] font-extrabold tracking-wide text-muted">
                        SKILL PREVIEW
                      </p>
                      <span className="text-[10px] font-bold text-wine">
                        {normalizedSkills.length} skills
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {normalizedSkills.map((skill) => (
                        <span
                          key={skill.toLowerCase()}
                          className="rounded-full border border-wine/10 bg-sand-light px-3 py-2 text-[10px] font-bold text-wine shadow-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {editing ? (
                <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-xs font-bold text-muted transition hover:bg-sand hover:text-ink disabled:opacity-50"
                  >
                    <X size={15} />
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving || !isDirty}
                    className="nx-button nx-button-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {saving ? "Saving changes..." : "Save changes"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 border-t border-border pt-5 text-[10px] text-muted">
                  <CircleCheck size={14} className="text-success" />
                  Your profile information is saved.
                </div>
              )}
            </form>
          </section>

          {/* RESUME MANAGEMENT */}
          <section className="overflow-hidden rounded-[24px] border border-border bg-sand-light shadow-soft">
            <div className="border-b border-border p-5 sm:p-7">
              <SectionTitle
                eyebrow="CAREER DOCUMENTS"
                title="Resume management"
                description="Keep your latest resume ready for job applications."
                icon={FileUp}
              />
            </div>

            <div className="p-5 sm:p-7">
              {user?.resumeUrl ? (
                <div className="flex flex-col gap-4 rounded-2xl border border-success/20 bg-success-soft p-5 sm:flex-row sm:items-center">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sand-light text-success shadow-sm">
                    <FileText size={27} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-extrabold text-ink">
                        Resume available
                      </p>
                      <span className="rounded-full bg-success/10 px-2.5 py-1 text-[9px] font-extrabold text-success">
                        UPLOADED
                      </span>
                    </div>

                    <p className="mt-1 text-xs leading-5 text-muted">
                      Your resume is ready to be viewed by employers when
                      you apply for jobs.
                    </p>
                  </div>

                  <a
                    href={user.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-success/20 bg-sand-light px-4 py-3 text-xs font-bold text-success transition hover:bg-white"
                  >
                    View resume
                    <ExternalLink size={14} />
                  </a>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-warning/30 bg-warning-soft p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand-light text-warning">
                      <AlertCircle size={19} />
                    </div>

                    <div>
                      <p className="text-sm font-extrabold text-ink">
                        No resume uploaded yet
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        Add a PDF resume so employers can review your
                        experience and qualifications.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-2xl border border-dashed border-wine/25 bg-wine-soft/40 p-5 sm:p-6">
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={uploadingResume}
                  className="hidden"
                  onChange={(event) => {
                    void handleResumeUpload(event.target.files?.[0]);
                  }}
                />

                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-wine text-sand shadow-lg shadow-wine/15">
                    {uploadingResume ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <UploadCloud size={25} />
                    )}
                  </div>

                  <h3 className="mt-4 text-sm font-extrabold text-ink">
                    {uploadingResume
                      ? "Uploading your resume..."
                      : user?.resumeUrl
                        ? "Replace your current resume"
                        : "Upload your resume"}
                  </h3>

                  <p className="mt-2 max-w-sm text-xs leading-5 text-muted">
                    Select a PDF file from your device. Your file must be
                    smaller than 5 MB.
                  </p>

                  <button
                    type="button"
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={uploadingResume}
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-wine px-5 py-3 text-xs font-bold text-sand transition hover:bg-wine-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadingResume ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Plus size={16} />
                    )}
                    {uploadingResume ? "Uploading..." : "Choose PDF file"}
                  </button>

                  <p className="mt-3 text-[9px] font-semibold tracking-wide text-muted">
                    PDF ONLY · MAXIMUM 5 MB
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="space-y-5 xl:sticky xl:top-6">

          {/* COMPLETION CHECKLIST */}
          <section className="rounded-[24px] border border-border bg-sand-light p-5 shadow-soft sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-extrabold tracking-[2px] text-wine">
                  PROFILE CHECKLIST
                </p>
                <h3 className="mt-1 font-heading text-lg font-extrabold text-ink">
                  Build your profile
                </h3>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wine-soft text-wine">
                <CheckCircle2 size={19} />
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-muted">
                  Completion
                </span>
                <span className="font-extrabold text-wine">
                  {completion}%
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand">
                <div
                  className="h-full rounded-full bg-wine transition-all duration-700"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                {
                  label: "Full name",
                  done: name.trim().length >= 2,
                },
                {
                  label: "Professional bio",
                  done: bio.trim().length >= 30,
                },
                {
                  label: "Technical skills",
                  done: normalizedSkills.length > 0,
                },
                {
                  label: "Profile picture",
                  done: Boolean(user?.profilePictureUrl),
                },
                {
                  label: "Resume",
                  done: Boolean(user?.resumeUrl),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    {item.done ? (
                      <CheckCircle2
                        size={16}
                        className="shrink-0 text-success"
                      />
                    ) : (
                      <div className="h-4 w-4 shrink-0 rounded-full border-2 border-border" />
                    )}

                    <span
                      className={`text-xs font-semibold ${
                        item.done ? "text-ink" : "text-muted"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] font-extrabold ${
                      item.done ? "text-success" : "text-subtle"
                    }`}
                  >
                    {item.done ? "DONE" : "TODO"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* SKILLS SUMMARY */}
          <section className="rounded-[24px] border border-border bg-sand-light p-5 shadow-soft sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wine-soft text-wine">
                <Code2 size={18} />
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-ink">
                  Your skills
                </h3>
                <p className="text-[10px] text-muted">
                  Professional expertise
                </p>
              </div>
            </div>

            {normalizedSkills.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {normalizedSkills.map((skill) => (
                  <span
                    key={skill.toLowerCase()}
                    className="rounded-full border border-wine/10 bg-wine-soft px-3 py-2 text-[10px] font-bold text-wine"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-sand p-4">
                <p className="text-xs leading-5 text-muted">
                  You have not added any skills yet. Add your technical
                  skills in the personal information section.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setEditing(true);
                document
                  .getElementById("profile-name")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className="mt-5 flex w-full items-center justify-between border-t border-border pt-4 text-xs font-bold text-wine transition hover:text-wine-dark"
            >
              Edit skills
              <ArrowUpRight size={15} />
            </button>
          </section>

          {/* PROFILE GUIDANCE */}
          <section className="relative overflow-hidden rounded-[24px] bg-wine p-5 text-sand-light shadow-wine sm:p-6">
            <div
              aria-hidden="true"
              className="absolute -bottom-16 -right-16 h-40 w-40 rounded-full border border-white/10"
            />

            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sand">
                <Sparkles size={19} />
              </div>

              <h3 className="mt-4 font-heading text-lg font-extrabold">
                Make your profile stand out
              </h3>

              <p className="mt-2 text-xs leading-5 text-sand/70">
                A clear bio, relevant skills and an updated resume give
                employers a better understanding of your background.
              </p>

              {missingItems.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {missingItems.slice(0, 3).map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 text-[10px] font-semibold text-sand/85"
                    >
                      <ChevronRight size={13} />
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-sand">
                  <CheckCircle2 size={15} />
                  Your profile looks complete.
                </div>
              )}
            </div>
          </section>

          {/* ACCOUNT INFORMATION */}
          <section className="rounded-[24px] border border-border bg-sand-light p-5 shadow-soft sm:p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-wine" />
              <h3 className="text-xs font-extrabold text-ink">
                Account information
              </h3>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-3">
                <Mail size={15} className="mt-0.5 text-muted" />
                <div className="min-w-0">
                  <p className="text-[9px] font-extrabold tracking-wide text-subtle">
                    EMAIL ADDRESS
                  </p>
                  <p className="mt-1 break-all text-xs font-bold text-ink">
                    {user?.email || "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BriefcaseBusiness size={15} className="mt-0.5 text-muted" />
                <div>
                  <p className="text-[9px] font-extrabold tracking-wide text-subtle">
                    ACCOUNT ROLE
                  </p>
                  <p className="mt-1 text-xs font-bold capitalize text-ink">
                    {user?.role || "Not available"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
