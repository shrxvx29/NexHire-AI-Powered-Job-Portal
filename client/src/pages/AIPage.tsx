
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ComponentType,
} from "react";

import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Copy,
  FileSearch,
  FileText,
  Lightbulb,
  MessageCircle,
  PenLine,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  WandSparkles,
  Zap,
} from "lucide-react";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

import {
  aiApi,
  type JobMatch,
  type ResumeAnalysis,
} from "../api/services";

import { getApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Tab = "chat" | "analyse" | "match" | "cover";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Tool = {
  id: Tab;
  label: string;
  description: string;
  eyebrow: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  color: string;
  background: string;
  title: string;
  subtitle: string;
  action: string;
};

/* -------------------------------------------------------------------------- */
/* CONFIGURATION                                                              */
/* -------------------------------------------------------------------------- */

const tools: Tool[] = [
  {
    id: "chat",
    label: "Career assistant",
    description: "Get guidance and career advice",
    eyebrow: "AI CONVERSATION",
    icon: MessageCircle,
    color: "text-wine",
    background: "bg-wine-soft",
    title: "Your career, one conversation away.",
    subtitle: "Ask questions, explore opportunities and get practical career guidance.",
    action: "Start conversation",
  },
  {
    id: "analyse",
    label: "Resume analyzer",
    description: "Discover strengths and gaps",
    eyebrow: "RESUME INTELLIGENCE",
    icon: FileSearch,
    color: "text-info",
    background: "bg-info-soft",
    title: "Make your resume work harder.",
    subtitle: "Understand what's working, identify weaknesses and get actionable improvements.",
    action: "Analyze my resume",
  },
  {
    id: "match",
    label: "Job match",
    description: "Measure job compatibility",
    eyebrow: "CAREER COMPATIBILITY",
    icon: Target,
    color: "text-success",
    background: "bg-success-soft",
    title: "Know how well you fit the role.",
    subtitle: "Compare your experience against a job description and uncover skill gaps.",
    action: "Calculate job match",
  },
  {
    id: "cover",
    label: "Cover letter",
    description: "Create tailored applications",
    eyebrow: "APPLICATION WRITER",
    icon: PenLine,
    color: "text-warning",
    background: "bg-warning-soft",
    title: "Write applications with purpose.",
    subtitle: "Generate a role-specific cover letter using your experience and target company.",
    action: "Generate cover letter",
  },
];

const quickPrompts = [
  {
    icon: FileSearch,
    title: "Improve my resume",
    prompt: "How can I improve my resume to get more interview calls?",
  },
  {
    icon: BriefcaseBusiness,
    title: "Prepare for interviews",
    prompt: "Prepare me for a full-stack developer technical interview.",
  },
  {
    icon: Target,
    title: "Build a job strategy",
    prompt: "Create a practical 30-day job search strategy for me.",
  },
  {
    icon: Lightbulb,
    title: "Explain my projects",
    prompt: "Help me explain my software projects confidently in interviews.",
  },
];

/* -------------------------------------------------------------------------- */
/* ANIMATION                                                                  */
/* -------------------------------------------------------------------------- */

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

/* -------------------------------------------------------------------------- */
/* REUSABLE COMPONENTS                                                        */
/* -------------------------------------------------------------------------- */

function SectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="text-[10px] font-extrabold tracking-[2px] text-wine">
      {children}
    </span>
  );
}

function ToolCard({
  tool,
  selected,
  onClick,
}: {
  tool: Tool;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = tool.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-card border p-4 text-left transition-all duration-200 sm:p-5 ${
        selected
          ? "border-wine bg-white shadow-card ring-1 ring-wine/10"
          : "border-border bg-sand-light hover:-translate-y-1 hover:border-wine/30 hover:shadow-soft"
      }`}
    >
      {selected && (
        <span className="absolute right-0 top-0 h-1 w-full bg-wine" />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tool.background} ${tool.color}`}>
          <Icon size={19} />
        </div>

        {selected ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-wine text-sand-light">
            <Check size={13} />
          </span>
        ) : (
          <ArrowRight
            size={16}
            className="text-subtle transition group-hover:translate-x-1 group-hover:text-wine"
          />
        )}
      </div>

      <div className="mt-5">
        <h3 className="text-xs font-extrabold text-ink">
          {tool.label}
        </h3>
        <p className="mt-1 text-[10px] leading-5 text-muted">
          {tool.description}
        </p>
      </div>
    </button>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  placeholder,
  required,
  maxLength,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-bold text-ink"
      >
        {label}
        {required && <span className="ml-1 text-wine">*</span>}
      </label>

      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        className="nx-input"
      />
    </div>
  );
}

function TextAreaField({
  label,
  id,
  value,
  onChange,
  placeholder,
  required,
  maxLength,
  rows = 6,
  helper,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  maxLength: number;
  rows?: number;
  helper?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="text-xs font-bold text-ink"
        >
          {label}
          {required && <span className="ml-1 text-wine">*</span>}
        </label>

        <span className="text-[9px] font-semibold text-muted">
          {value.length.toLocaleString()}/{maxLength.toLocaleString()}
        </span>
      </div>

      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        rows={rows}
        className="nx-input min-h-[130px] resize-y py-3 text-xs leading-6"
      />

      {helper && (
        <p className="mt-2 flex items-start gap-2 text-[10px] leading-5 text-muted">
          <Lightbulb size={13} className="mt-0.5 shrink-0 text-wine" />
          {helper}
        </p>
      )}
    </div>
  );
}

function ScoreCard({
  score,
  label,
  description,
}: {
  score: number;
  label: string;
  description: string;
}) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));

  return (
    <div className="relative overflow-hidden rounded-card bg-wine-dark p-6 text-sand-light sm:p-7">
      <div
        aria-hidden="true"
        className="absolute -right-16 -top-24 h-64 w-64 rounded-full border border-sand/10"
      />
      <div
        aria-hidden="true"
        className="absolute -right-8 -top-16 h-48 w-48 rounded-full border border-sand/10"
      />

      <div className="relative flex flex-col items-center text-center">
        <span className="text-[9px] font-extrabold tracking-[2px] text-sand/60">
          {label.toUpperCase()}
        </span>

        <div
          className="relative mt-5 flex h-36 w-36 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(#F5EBD0 ${safeScore * 3.6}deg, rgba(245,235,208,0.14) 0deg)`,
          }}
        >
          <div className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full bg-wine-dark">
            <span className="font-heading text-5xl font-extrabold tabular-nums">
              {safeScore}
            </span>
            <span className="mt-1 text-[10px] font-semibold text-sand/50">
              OUT OF 100
            </span>
          </div>
        </div>

        <p className="mt-5 max-w-xs text-xs leading-6 text-sand/70">
          {description}
        </p>
      </div>
    </div>
  );
}

function ResultSection({
  title,
  items,
  variant = "default",
}: {
  title: string;
  items?: string[];
  variant?: "default" | "positive" | "negative";
}) {
  if (!items?.length) return null;

  const markerStyle = {
    default: "bg-wine-soft text-wine",
    positive: "bg-success-soft text-success",
    negative: "bg-danger-soft text-danger",
  }[variant];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-extrabold text-ink">
          {title}
        </h3>
        <span className="rounded-full bg-sand px-2.5 py-1 text-[9px] font-bold text-muted">
          {items.length} items
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className="flex items-start gap-3 rounded-control border border-border/70 bg-white p-3"
          >
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold ${markerStyle}`}>
              {variant === "positive" ? (
                <Check size={13} />
              ) : (
                index + 1
              )}
            </span>

            <p className="text-xs leading-6 text-muted">
              {item}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center rounded-panel border border-dashed border-border bg-sand-light px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-wine-soft text-wine">
        <Icon size={27} />
      </div>

      <h3 className="mt-5 font-heading text-lg font-extrabold text-ink">
        {title}
      </h3>

      <p className="mt-2 max-w-xs text-xs leading-6 text-muted">
        {description}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center rounded-panel border border-border bg-sand-light p-8 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-wine-soft text-wine">
        <Sparkles size={27} className="animate-pulse" />
        <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-wine" />
      </div>

      <h3 className="mt-5 font-heading text-base font-extrabold text-ink">
        Working on your results
      </h3>

      <p className="mt-2 max-w-xs text-xs leading-6 text-muted">
        NexHire AI is processing your information. This may take a moment.
      </p>

      <div className="mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-sand">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-wine" />
      </div>
    </div>
  );
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => (
          <p className="mb-3 last:mb-0 text-ink">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="mb-3 list-disc space-y-1 pl-5 text-ink">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-3 list-decimal space-y-1 pl-5 text-ink">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="pl-1">{children}</li>
        ),
        strong: ({ children }) => (
          <strong className="font-extrabold text-wine">
            {children}
          </strong>
        ),
        h1: ({ children }) => (
          <h3 className="mb-2 mt-3 font-heading text-base font-extrabold text-ink">
            {children}
          </h3>
        ),
        h2: ({ children }) => (
          <h3 className="mb-2 mt-3 font-heading text-sm font-extrabold text-ink">
            {children}
          </h3>
        ),
        code: ({ children }) => (
          <code className="rounded bg-sand px-1.5 py-0.5 text-[11px] text-wine">
            {children}
          </code>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN PAGE                                                                  */
/* -------------------------------------------------------------------------- */

export default function AIPage() {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const [tab, setTab] = useState<Tab>("chat");

  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [match, setMatch] = useState<JobMatch | null>(null);
  const [cover, setCover] = useState("");

  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const activeTool = tools.find((tool) => tool.id === tab) ?? tools[0];
  const ActiveIcon = activeTool.icon;

  const showMotion = !shouldReduceMotion;

  const displayName = user?.name?.trim().split(/\s+/)[0] || "there";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: shouldReduceMotion ? "auto" : "smooth",
      block: "end",
    });
  }, [history, busy, shouldReduceMotion]);

  /* ------------------------------------------------------------------------ */
  /* HELPERS                                                                  */
  /* ------------------------------------------------------------------------ */

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Clipboard unavailable");
    }
  };

  const changeTab = (nextTab: Tab) => {
    if (busy) return;

    setTab(nextTab);
    setError("");
  };

  /* ------------------------------------------------------------------------ */
  /* AI TOOL SUBMISSION                                                       */
  /* ------------------------------------------------------------------------ */

  const run = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (busy) return;

    if (!resumeText.trim()) {
      toast.error("Please provide your resume content.");
      return;
    }

    if (tab === "match" && !jobDescription.trim()) {
      toast.error("Please provide the job description.");
      return;
    }

    if (tab === "cover" && (!jobTitle.trim() || !companyName.trim())) {
      toast.error("Enter the job title and company name.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      if (tab === "analyse") {
        const response = await aiApi.analyseResume(
          resumeText.trim(),
          jobDescription.trim()
        );

        setAnalysis(response.data.data);
        toast.success("Resume analysis completed");
      } else if (tab === "match") {
        const response = await aiApi.match(
          resumeText.trim(),
          jobDescription.trim()
        );

        setMatch(response.data.data);
        toast.success("Job match analysis completed");
      } else if (tab === "cover") {
        const response = await aiApi.coverLetter({
          resumeText: resumeText.trim(),
          jobTitle: jobTitle.trim(),
          companyName: companyName.trim(),
          jobDescription: jobDescription.trim(),
        });

        setCover(response.data.data.coverLetter);
        toast.success("Cover letter generated");
      }
    } catch (err) {
      const message = getApiError(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* CHAT                                                                     */
  /* ------------------------------------------------------------------------ */

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = message.trim();

    if (!content || busy) return;

    const previousHistory = history.slice(-10);

    const nextHistory: ChatMessage[] = [
      ...history,
      { role: "user", content },
    ];

    setHistory(nextHistory);
    setMessage("");
    setBusy(true);
    setError("");

    try {
      const response = await aiApi.chat(content, previousHistory);

      setHistory([
        ...nextHistory,
        {
          role: "assistant",
          content: response.data.data.reply,
        },
      ]);
    } catch (err) {
      const apiError = getApiError(err);
      setError(apiError);
      toast.error(apiError);
    } finally {
      setBusy(false);
      chatInputRef.current?.focus();
    }
  };

  const clearChat = () => {
    if (busy) return;

    setHistory([]);
    setMessage("");
    setError("");
  };

  /* ------------------------------------------------------------------------ */
  /* REPORT TEXT                                                              */
  /* ------------------------------------------------------------------------ */

  const getAnalysisText = () => {
    if (!analysis) return "";

    return [
      `RESUME QUALITY ESTIMATE: ${analysis.overallScore}/100`,
      analysis.summary,
      `STRENGTHS\n${(analysis.strengths ?? []).map((x) => `- ${x}`).join("\n")}`,
      `WEAKNESSES\n${(analysis.weaknesses ?? []).map((x) => `- ${x}`).join("\n")}`,
      `TECHNICAL SKILLS\n${(analysis.technicalSkills ?? []).map((x) => `- ${x}`).join("\n")}`,
      `MISSING SKILLS\n${(analysis.missingSkills ?? []).map((x) => `- ${x}`).join("\n")}`,
      `ATS KEYWORDS\n${(analysis.atsKeywords ?? []).map((x) => `- ${x}`).join("\n")}`,
      `IMPROVEMENTS\n${(analysis.improvements ?? []).map((x) => `- ${x}`).join("\n")}`,
    ].join("\n\n");
  };

  const getMatchText = () => {
    if (!match) return "";

    return [
      `JOB MATCH: ${match.matchScore}/100`,
      `LEVEL: ${match.matchLevel}`,
      match.explanation,
      `MATCHED SKILLS\n${(match.matchedSkills ?? []).map((x) => `- ${x}`).join("\n")}`,
      `MISSING SKILLS\n${(match.missingSkills ?? []).map((x) => `- ${x}`).join("\n")}`,
      `RELEVANT EXPERIENCE\n${(match.relevantExperience ?? []).map((x) => `- ${x}`).join("\n")}`,
      `RECOMMENDATIONS\n${(match.recommendations ?? []).map((x) => `- ${x}`).join("\n")}`,
    ].join("\n\n");
  };

  /* ------------------------------------------------------------------------ */
  /* CHAT VIEW                                                                */
  /* ------------------------------------------------------------------------ */

  const renderChat = () => (
    <motion.section
      key="chat"
      initial={showMotion ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={showMotion ? { opacity: 0, y: -8 } : undefined}
      transition={{ duration: 0.25 }}
      className="overflow-hidden rounded-panel border border-border bg-sand-light shadow-soft"
    >
      {/* Chat heading */}
      <div className="flex flex-col justify-between gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-wine text-sand-light shadow-wine">
            <Bot size={24} />
          </div>

          <div>
            <h2 className="font-heading text-sm font-extrabold text-ink">
              NexHire Career Assistant
            </h2>
            <p className="mt-1 text-[10px] text-muted">
              Practical guidance for your next career move
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1.5 text-[10px] font-bold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Assistant available
          </span>

          <button
            type="button"
            onClick={clearChat}
            disabled={!history.length || busy}
            className="flex h-9 items-center gap-2 rounded-control border border-border px-3 text-[10px] font-bold text-muted transition hover:border-wine hover:text-wine disabled:opacity-40"
          >
            <RotateCcw size={13} />
            New chat
          </button>
        </div>
      </div>

      {/* Conversation */}
      <div className="flex min-h-[390px] max-h-[620px] flex-col overflow-y-auto bg-sand/40 p-4 sm:p-7">
        {!history.length ? (
          <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-wine-soft text-wine">
              <Bot size={34} />
              <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-xl bg-wine text-sand-light">
                <Sparkles size={14} />
              </span>
            </div>

            <p className="mt-6 text-[10px] font-extrabold tracking-[2px] text-wine">
              YOUR AI CAREER PARTNER
            </p>

            <h3 className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-ink">
              What are we working on, {displayName}?
            </h3>

            <p className="mt-2 max-w-md text-xs leading-6 text-muted">
              Ask about interviews, resumes, career direction or your next job opportunity.
            </p>

            <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
              {quickPrompts.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => {
                      setMessage(item.prompt);
                      chatInputRef.current?.focus();
                    }}
                    className="group flex items-center gap-3 rounded-card border border-border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-wine/30 hover:shadow-soft"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wine-soft text-wine">
                      <Icon size={17} />
                    </div>

                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-extrabold text-ink">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-[10px] text-muted">
                        Start with this prompt
                      </span>
                    </span>

                    <ArrowRight
                      size={15}
                      className="shrink-0 text-subtle transition group-hover:translate-x-1 group-hover:text-wine"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-6">
            {history.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`flex gap-3 ${
                  item.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {item.role === "assistant" && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wine text-sand-light">
                    <Bot size={18} />
                  </div>
                )}

                <div className="min-w-0 max-w-[88%]">
                  <div
                    className={`rounded-2xl p-4 text-xs leading-7 ${
                      item.role === "user"
                        ? "rounded-br-sm bg-wine text-sand-light"
                        : "rounded-bl-sm border border-border bg-white text-ink"
                    }`}
                  >
                    {item.role === "assistant" ? (
                      <MarkdownMessage content={item.content} />
                    ) : (
                      <p className="whitespace-pre-wrap text-sand-light">
                        {item.content}
                      </p>
                    )}
                  </div>

                  {item.role === "assistant" && (
                    <button
                      type="button"
                      onClick={() => copy(item.content)}
                      className="mt-2 inline-flex items-center gap-1.5 px-1 text-[10px] font-semibold text-muted transition hover:text-wine"
                    >
                      <Copy size={11} />
                      Copy response
                    </button>
                  )}
                </div>

                {item.role === "user" && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-sand text-wine">
                    <UserRound size={17} />
                  </div>
                )}
              </div>
            ))}

            {busy && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-wine text-sand-light">
                  <Bot size={18} />
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 text-xs text-muted">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-wine" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-wine [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-wine [animation-delay:300ms]" />
                  </span>
                  Thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="border-t border-danger/15 bg-danger-soft px-5 py-3 text-xs text-danger"
        >
          {error}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={send}
        className="border-t border-border bg-sand-light p-4 sm:p-5"
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-card border border-border bg-white p-2 shadow-soft transition focus-within:border-wine/40 focus-within:ring-4 focus-within:ring-wine/5">
          <input
            ref={chatInputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask anything about your career..."
            maxLength={5000}
            disabled={busy}
            aria-label="Message your career assistant"
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-xs text-ink outline-none placeholder:text-subtle"
          />

          <button
            type="submit"
            disabled={busy || !message.trim()}
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-wine text-sand-light transition hover:bg-wine-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={17} />
          </button>
        </div>

        <p className="mt-3 text-center text-[9px] text-muted">
          AI responses may contain mistakes. Verify important career information.
        </p>
      </form>
    </motion.section>
  );

  /* ------------------------------------------------------------------------ */
  /* TOOL FORM                                                                */
  /* ------------------------------------------------------------------------ */

  const renderToolForm = () => (
    <form
      onSubmit={run}
      className="space-y-6 rounded-panel border border-border bg-sand-light p-5 shadow-soft sm:p-7"
    >
      <div className="flex items-center gap-3 border-b border-border pb-5">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${activeTool.background} ${activeTool.color}`}>
          <ActiveIcon size={21} />
        </div>

        <div>
          <SectionLabel>{activeTool.eyebrow}</SectionLabel>
          <h2 className="mt-1 font-heading text-lg font-extrabold text-ink">
            {activeTool.label}
          </h2>
          <p className="mt-1 text-[10px] text-muted">
            {activeTool.description}
          </p>
        </div>
      </div>

      <TextAreaField
        id="resumeText"
        label="Resume content"
        value={resumeText}
        onChange={setResumeText}
        required
        maxLength={30000}
        rows={10}
        placeholder={`Paste your resume text here...

Example:
Frontend Developer
Skills: React, TypeScript, JavaScript...
Projects: NexHire AI Job Portal...`}
        helper="Paste readable resume text. Your current backend accepts text, not a PDF file directly."
      />

      {tab === "cover" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="jobTitle"
            label="Job title"
            value={jobTitle}
            onChange={setJobTitle}
            placeholder="Frontend Developer"
            required
            maxLength={150}
          />

          <Field
            id="companyName"
            label="Company name"
            value={companyName}
            onChange={setCompanyName}
            placeholder="Company name"
            required
            maxLength={150}
          />
        </div>
      )}

      <TextAreaField
        id="jobDescription"
        label="Job description"
        value={jobDescription}
        onChange={setJobDescription}
        required={tab === "match"}
        maxLength={10000}
        rows={7}
        placeholder="Paste the job description here to get more relevant results..."
        helper={
          tab === "match"
            ? "Required. The AI compares your resume against this job description."
            : "Optional. Adding the job description makes your results more targeted."
        }
      />

      {error && (
        <div
          role="alert"
          className="rounded-control border border-danger/20 bg-danger-soft p-3 text-xs text-danger"
        >
          {error}
        </div>
      )}

      <div className="rounded-control border border-border bg-white p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-success" />

          <div>
            <p className="text-xs font-bold text-ink">
              Your information matters
            </p>
            <p className="mt-1 text-[10px] leading-5 text-muted">
              Review AI-generated recommendations before using them in an application.
            </p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={
          busy ||
          !resumeText.trim() ||
          (tab === "match" && !jobDescription.trim()) ||
          (tab === "cover" && (!jobTitle.trim() || !companyName.trim()))
        }
        className="nx-button nx-button-primary w-full"
      >
        {busy ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-sand/40 border-t-sand" />
            Generating insights...
          </>
        ) : (
          <>
            <WandSparkles size={17} />
            {activeTool.action}
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  );

  /* ------------------------------------------------------------------------ */
  /* RESULTS                                                                  */
  /* ------------------------------------------------------------------------ */

  const renderResults = () => {
    if (busy) return <LoadingState />;

    if (tab === "analyse" && analysis) {
      return (
        <div className="space-y-5 rounded-panel border border-border bg-sand-light p-5 shadow-soft sm:p-6">
          <ScoreCard
            score={analysis.overallScore}
            label="Resume quality estimate"
            description="An AI-generated assessment of the resume content you provided. This is not a score from an actual ATS platform."
          />

          <section className="rounded-card border border-border bg-white p-4">
            <SectionLabel>OVERVIEW</SectionLabel>
            <h3 className="mt-2 font-heading text-sm font-extrabold text-ink">
              Executive summary
            </h3>
            <p className="mt-2 text-xs leading-7 text-muted">
              {analysis.summary}
            </p>
          </section>

          <ResultSection
            title="Strengths"
            items={analysis.strengths}
            variant="positive"
          />

          <ResultSection
            title="Weaknesses"
            items={analysis.weaknesses}
            variant="negative"
          />

          <ResultSection
            title="Technical skills"
            items={analysis.technicalSkills}
          />

          <ResultSection
            title="Missing skills"
            items={analysis.missingSkills}
            variant="negative"
          />

          <ResultSection
            title="ATS keywords"
            items={analysis.atsKeywords}
          />

          <ResultSection
            title="Recommended improvements"
            items={analysis.improvements}
            variant="positive"
          />

          <button
            type="button"
            onClick={() => copy(getAnalysisText())}
            className="nx-button nx-button-secondary w-full"
          >
            <Copy size={15} />
            Copy full analysis
          </button>
        </div>
      );
    }

    if (tab === "match" && match) {
      return (
        <div className="space-y-5 rounded-panel border border-border bg-sand-light p-5 shadow-soft sm:p-6">
          <ScoreCard
            score={match.matchScore}
            label={match.matchLevel || "Job match"}
            description="An AI-generated comparison of your resume and the job description. Treat this as guidance, not a hiring prediction."
          />

          <section className="rounded-card border border-border bg-white p-4">
            <SectionLabel>COMPATIBILITY OVERVIEW</SectionLabel>
            <h3 className="mt-2 font-heading text-sm font-extrabold text-ink">
              Match explanation
            </h3>
            <p className="mt-2 text-xs leading-7 text-muted">
              {match.explanation}
            </p>
          </section>

          <ResultSection
            title="Matched skills"
            items={match.matchedSkills}
            variant="positive"
          />

          <ResultSection
            title="Missing skills"
            items={match.missingSkills}
            variant="negative"
          />

          <ResultSection
            title="Relevant experience"
            items={match.relevantExperience}
          />

          <ResultSection
            title="Recommendations"
            items={match.recommendations}
            variant="positive"
          />

          <button
            type="button"
            onClick={() => copy(getMatchText())}
            className="nx-button nx-button-secondary w-full"
          >
            <Copy size={15} />
            Copy match report
          </button>
        </div>
      );
    }

    if (tab === "cover" && cover) {
      return (
        <div className="space-y-5 rounded-panel border border-border bg-sand-light p-5 shadow-soft sm:p-6">
          <div className="rounded-card bg-success-soft p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-success">
                <Check size={20} />
              </div>

              <div>
                <h3 className="text-xs font-extrabold text-ink">
                  Cover letter generated
                </h3>
                <p className="mt-1 text-[10px] text-muted">
                  Review and personalize before sending.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-card border border-border bg-white p-5">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <span className="text-[9px] font-extrabold tracking-[2px] text-wine">
                YOUR COVER LETTER
              </span>
              <FileText size={16} className="text-muted" />
            </div>

            <div className="whitespace-pre-wrap text-xs leading-7 text-ink">
              {cover}
            </div>
          </div>

          <button
            type="button"
            onClick={() => copy(cover)}
            className="nx-button nx-button-primary w-full"
          >
            <Copy size={15} />
            Copy cover letter
          </button>
        </div>
      );
    }

    return (
      <EmptyState
        icon={activeTool.icon}
        title="Your results will appear here"
        description="Complete the form and run the AI tool. Your personalized insights will be displayed here."
      />
    );
  };

  /* ------------------------------------------------------------------------ */
  /* PAGE                                                                     */
  /* ------------------------------------------------------------------------ */

  return (
    <motion.div
      variants={stagger}
      initial={showMotion ? "hidden" : false}
      animate="visible"
      className="mx-auto w-full max-w-[1400px] space-y-8 pb-12"
    >
      {/* HERO */}
      <motion.section
        variants={showMotion ? fadeUp : undefined}
        className="relative overflow-hidden rounded-panel bg-wine-dark p-6 text-sand-light shadow-premium sm:p-9 lg:p-10"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 -top-36 h-[430px] w-[430px] rounded-full border border-sand/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-20 h-[300px] w-[300px] rounded-full border border-sand/10"
        />

        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sand/15 bg-sand/10 px-3 py-1.5">
              <Sparkles size={13} />
              <span className="text-[9px] font-extrabold tracking-[2px] text-sand/80">
                NEXHIRE INTELLIGENCE
              </span>
            </div>

            <p className="mb-2 text-xs font-semibold text-sand/60">
              A smarter way to move forward, {displayName}.
            </p>

            <h1 className="font-heading text-3xl font-extrabold leading-tight tracking-[-1.5px] sm:text-4xl lg:text-5xl">
              Your next career move
              <br />
              <span className="font-editorial font-medium italic text-sand">
                starts with clarity.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-xs leading-7 text-sand/65 sm:text-sm">
              Turn uncertainty into action. Analyze your resume, understand job
              compatibility, create stronger applications and get practical
              guidance from your AI career assistant.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-control border border-sand/15 bg-sand/10 px-3 py-2.5">
                <Zap size={14} className="text-sand" />
                <span className="text-[10px] font-bold text-sand/80">
                  4 career tools
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-control border border-sand/15 bg-sand/10 px-3 py-2.5">
                <ShieldCheck size={14} className="text-sand" />
                <span className="text-[10px] font-bold text-sand/80">
                  AI-powered insights
                </span>
              </div>
            </div>
          </div>

          <div className="hidden items-center justify-center lg:flex">
            <div className="relative flex h-52 w-52 items-center justify-center rounded-full border border-sand/20 bg-sand/5">
              <div className="absolute inset-5 rounded-full border border-dashed border-sand/30" />
              <div className="flex h-28 w-28 items-center justify-center rounded-[30px] bg-sand text-wine shadow-wine">
                <Bot size={48} />
              </div>

              <div className="absolute right-1 top-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-sand/15 bg-wine-light text-sand shadow-wine">
                <Sparkles size={20} />
              </div>

              <div className="absolute bottom-5 left-0 flex h-12 w-12 items-center justify-center rounded-2xl border border-sand/15 bg-wine-light text-sand shadow-wine">
                <Target size={20} />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* TOOL SELECTOR */}
      <motion.section
        variants={showMotion ? fadeUp : undefined}
        className="space-y-4"
      >
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <SectionLabel>YOUR CAREER TOOLKIT</SectionLabel>
            <h2 className="mt-1 font-heading text-xl font-extrabold text-ink sm:text-2xl">
              What would you like to work on?
            </h2>
          </div>

          <p className="text-[10px] text-muted">
            Choose a tool to get started.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              selected={tab === tool.id}
              onClick={() => changeTab(tool.id)}
            />
          ))}
        </div>
      </motion.section>

      {/* ACTIVE TOOL INTRO */}
      <motion.section
        variants={showMotion ? fadeUp : undefined}
        className="flex flex-col justify-between gap-4 rounded-card border border-border bg-sand-light p-5 sm:flex-row sm:items-center sm:p-6"
      >
        <div className="flex items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${activeTool.background} ${activeTool.color}`}>
            <ActiveIcon size={20} />
          </div>

          <div>
            <SectionLabel>{activeTool.eyebrow}</SectionLabel>
            <h2 className="mt-1 font-heading text-lg font-extrabold text-ink">
              {activeTool.title}
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-6 text-muted">
              {activeTool.subtitle}
            </p>
          </div>
        </div>

        <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-[9px] font-bold text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          AI TOOLKIT
        </span>
      </motion.section>

      {/* TOOL WORKSPACE */}
      <AnimatePresence mode="wait">
        {tab === "chat" ? (
          renderChat()
        ) : (
          <motion.section
            key={tab}
            initial={showMotion ? { opacity: 0, y: 12 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={showMotion ? { opacity: 0, y: -8 } : undefined}
            transition={{ duration: 0.25 }}
            className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]"
          >
            <div className="min-w-0">
              {renderToolForm()}
            </div>

            <div className="min-w-0 space-y-4 xl:sticky xl:top-6">
              <div className="flex items-center justify-between">
                <div>
                  <SectionLabel>AI GENERATED INSIGHTS</SectionLabel>
                  <h2 className="mt-1 font-heading text-xl font-extrabold text-ink">
                    Your results
                  </h2>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wine-soft text-wine">
                  <WandSparkles size={19} />
                </div>
              </div>

              {renderResults()}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* DISCLAIMER */}
      <motion.div
        variants={showMotion ? fadeUp : undefined}
        className="flex items-start gap-3 rounded-card border border-border bg-sand-light p-4"
      >
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-success" />

        <p className="text-[10px] leading-6 text-muted">
          <strong className="text-ink">A note about AI:</strong>{" "}
          NexHire provides AI-generated suggestions, not guaranteed hiring
          outcomes. Resume scores and job match scores are estimates, not
          official ATS results or hiring predictions. Verify important
          information and ensure your applications accurately represent
          your experience.
        </p>
      </motion.div>
    </motion.div>
  );
}
