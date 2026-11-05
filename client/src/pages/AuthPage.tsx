
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import Brand from "../components/Brand";
import { useAuth } from "../context/AuthContext";

type AuthPageProps = {
  mode: "login" | "register";
};

type Role = "seeker" | "employer";

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
};

const ease = [0.22, 1, 0.36, 1] as const;

const roles: {
  value: Role;
  title: string;
  description: string;
  icon: typeof UserRound;
}[] = [
  {
    value: "seeker",
    title: "Job seeker",
    description: "Discover jobs and grow your career.",
    icon: UserRound,
  },
  {
    value: "employer",
    title: "Employer",
    description: "Post jobs and find great talent.",
    icon: BriefcaseBusiness,
  },
];

const passwordRules = [
  {
    label: "At least 8 characters",
    test: (value: string) => value.length >= 8,
  },
  {
    label: "One uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    label: "One number",
    test: (value: string) => /\d/.test(value),
  },
  {
    label: "One special character",
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
];

function validateName(value: string) {
  const name = value.trim();

  if (!name) return "Please enter your full name.";
  if (name.length < 2) return "Name must contain at least 2 characters.";
  if (name.length > 80) return "Name cannot exceed 80 characters.";

  return "";
}

function validateEmail(value: string) {
  const email = value.trim().toLowerCase();

  if (!email) return "Please enter your email address.";
  if (email.length > 254) return "Email address is too long.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Please enter a valid email address.";
  }

  return "";
}

function validatePassword(value: string) {
  if (!value) return "Please enter your password.";
  if (value.length < 8) return "Password must contain at least 8 characters.";
  if (value.length > 128) return "Password cannot exceed 128 characters.";

  return "";
}

function getPasswordStrength(password: string) {
  if (!password) return 0;

  return passwordRules.filter((rule) => rule.test(password)).length;
}

function getPasswordStrengthLabel(strength: number) {
  if (strength <= 1) return "Weak";
  if (strength === 2) return "Fair";
  if (strength === 3) return "Good";
  return "Strong";
}

function getPasswordStrengthColor(strength: number) {
  if (strength <= 1) return "bg-red-500";
  if (strength === 2) return "bg-orange-500";
  if (strength === 3) return "bg-yellow-500";
  return "bg-emerald-600";
}

export default function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === "register";

  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("seeker");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  const motionDuration = shouldReduceMotion ? 0 : 0.35;

  const pageAnimation = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease },
      };

  if (user) {
    return (
      <Navigate
        to={user.role === "employer" ? "/employer" : "/dashboard"}
        replace
      />
    );
  }

  const updateError = (field: keyof FieldErrors, message: string) => {
    setErrors((previous) => ({
      ...previous,
      [field]: message || undefined,
    }));
  };

  const validateField = (field: keyof FieldErrors, value: string) => {
    let message = "";

    if (field === "name") message = validateName(value);
    if (field === "email") message = validateEmail(value);
    if (field === "password") message = validatePassword(value);

    updateError(field, message);
    return message;
  };

  const validateForm = () => {
    const nextErrors: FieldErrors = {
      ...(isRegister && validateName(name)
        ? { name: validateName(name) }
        : {}),
      ...(validateEmail(email)
        ? { email: validateEmail(email) }
        : {}),
      ...(validatePassword(password)
        ? { password: validatePassword(password) }
        : {}),
    };

    setErrors(nextErrors);
    setSubmitted(true);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (busy || !validateForm()) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    setBusy(true);

    try {
      const account = isRegister
        ? await register(normalizedName, normalizedEmail, password, role)
        : await login(normalizedEmail, password);

      toast.success(isRegister ? "Welcome to NexHire!" : "Welcome back!");

      navigate(
        account.role === "employer" ? "/employer" : "/dashboard",
        { replace: true }
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `nx-input w-full transition-all duration-200 ${
      hasError
        ? "!border-red-400 !ring-2 !ring-red-100"
        : "focus:!border-wine focus:!ring-2 focus:!ring-wine/10"
    }`;

  return (
    <main className="min-h-screen overflow-x-hidden bg-sand">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">

        {/* LEFT: BRAND EXPERIENCE */}

        <section className="relative isolate flex min-h-[420px] flex-col justify-between overflow-hidden bg-wine-dark px-5 py-6 text-sand-light sm:min-h-[480px] sm:px-10 sm:py-8 lg:min-h-screen lg:px-12 xl:px-16">

          {/* Decorative background */}

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-52 top-20 -z-10 h-[550px] w-[550px] rounded-full border border-sand/10"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 top-36 -z-10 h-[400px] w-[400px] rounded-full border border-sand/10"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -left-32 -z-10 h-[450px] w-[450px] rounded-full bg-wine-light/30 blur-[100px]"
          />

          {/* Brand */}

          <header className="relative z-10 flex items-center justify-between">
            <Brand />

            <span className="hidden rounded-full border border-sand/20 px-4 py-2 text-[9px] font-bold tracking-[2px] text-sand/70 sm:block">
              CAREER PLATFORM
            </span>
          </header>

          {/* Hero content */}

          <motion.div
            {...(shouldReduceMotion
              ? {}
              : {
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.6, ease },
                })}
            className="relative z-10 my-12 max-w-2xl lg:my-0 lg:py-16"
          >
            <div className="mb-6 flex items-center gap-3 text-[10px] font-bold tracking-[2.5px] text-sand/80">
              <span className="h-2 w-2 rounded-full bg-sand shadow-[0_0_12px_#F5EBD0]" />
              THE FUTURE OF YOUR CAREER
            </div>

            <h1 className="max-w-xl font-heading text-4xl font-extrabold leading-[1.08] tracking-[-2px] text-sand-light sm:text-5xl md:text-6xl lg:text-[clamp(48px,5vw,72px)]">
              {isRegister ? (
                <>
                  Don't just
                  <br />
                  find a job.
                  <br />
                  Find your
                  <br />
                  <span className="font-editorial font-medium italic text-sand">
                    next chapter.
                  </span>
                </>
              ) : (
                <>
                  Your next
                  <br />
                  opportunity
                  <br />
                  starts
                  <br />
                  <span className="font-editorial font-medium italic text-sand">
                    right here.
                  </span>
                </>
              )}
            </h1>

            <p className="mt-6 max-w-md text-sm leading-7 text-sand/65 sm:mt-7 sm:leading-8">
              A smarter way to discover opportunities, showcase your potential
              and build a career that moves you forward.
            </p>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-2" aria-hidden="true">
                {["S", "A", "M", "+"].map((avatar, index) => (
                  <div
                    key={index}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-wine-dark text-[10px] font-extrabold ${
                      index === 3
                        ? "bg-wine-light text-sand"
                        : "bg-sand text-wine"
                    }`}
                  >
                    {avatar}
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-bold text-sand-light">
                  Built for what's next.
                </p>
                <p className="mt-1 text-[10px] text-sand/50">
                  One platform. New possibilities.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Product preview - desktop only */}

          <motion.div
            {...(shouldReduceMotion
              ? {}
              : {
                  initial: { opacity: 0, x: 35, rotate: -3 },
                  animate: { opacity: 1, x: 0, rotate: -3 },
                  transition: { duration: 0.7, delay: 0.2, ease },
                })}
            className="absolute bottom-[17%] right-[5%] hidden w-[270px] rounded-2xl border border-white/40 bg-sand-light p-5 text-ink shadow-2xl xl:block"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[8px] font-bold tracking-[2px] text-muted">
                  NEXHIRE PREVIEW
                </span>
                <h3 className="mt-1 text-base font-extrabold">
                  Opportunity board
                </h3>
              </div>

              <div className="rounded-lg bg-wine p-2 text-sand">
                <ArrowUpRight size={17} />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-white/70 px-3 py-3">
              <Search size={14} className="text-muted" />
              <span className="flex-1 text-[9px] text-muted">
                Search opportunities...
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3 border-b border-border pb-4">
              <div className="rounded-lg bg-wine p-3 text-sand">
                <BriefcaseBusiness size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold">Frontend Developer</p>
                <p className="mt-1 text-[9px] text-muted">
                  Product Engineering · Full-time
                </p>
              </div>

              <ArrowUpRight size={16} />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[9px] text-muted">
                <CheckCircle2 size={13} className="text-emerald-600" />
                Discover. Apply. Grow.
              </div>

              <span className="text-[9px] text-muted">SAMPLE</span>
            </div>
          </motion.div>

          {/* Footer */}

          <footer className="relative z-10 flex items-center justify-between gap-3 text-[8px] font-bold tracking-[1.5px] text-sand/40">
            <span>© {new Date().getFullYear()} NEXHIRE</span>
            <span className="hidden sm:block">
              YOUR POTENTIAL. YOUR NEXT MOVE.
            </span>
          </footer>
        </section>

        {/* RIGHT: AUTHENTICATION */}

        <section className="relative flex min-h-screen flex-col bg-sand px-5 py-6 sm:px-10 sm:py-8 lg:px-12 xl:px-16">

          {/* Top navigation */}

          <div className="flex items-center justify-end gap-2 text-[9px] font-bold text-muted sm:gap-3 sm:text-[10px]">
            <span>
              {isRegister
                ? "ALREADY HAVE AN ACCOUNT?"
                : "NEW TO NEXHIRE?"}
            </span>

            <Link
              to={isRegister ? "/login" : "/register"}
              className="flex min-h-10 items-center gap-1 rounded-lg px-2 text-wine transition-colors hover:bg-wine/5 hover:text-wine-dark"
            >
              {isRegister ? "Sign in" : "Create account"}
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {/* Form container */}

          <motion.div
            {...pageAnimation}
            className="mx-auto my-auto w-full max-w-[430px] py-10 sm:py-14"
          >
            {/* Heading */}

            <div className="mb-8 sm:mb-9">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-wine/10 bg-sand-light text-wine shadow-soft">
                {isRegister ? (
                  <Sparkles size={21} />
                ) : (
                  <BriefcaseBusiness size={21} />
                )}
              </div>

              <span className="text-[9px] font-extrabold tracking-[2px] text-wine">
                {isRegister ? "LET'S GET STARTED" : "WELCOME BACK"}
              </span>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={
                    shouldReduceMotion ? false : { opacity: 0, y: 10 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    shouldReduceMotion ? undefined : { opacity: 0, y: -8 }
                  }
                  transition={{ duration: motionDuration }}
                >
                  <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-[-1.5px] text-wine-dark sm:text-[38px]">
                    {isRegister
                      ? "Create your account."
                      : "Good things await."}
                  </h2>

                  <p className="mt-3 max-w-sm text-xs leading-7 text-muted">
                    {isRegister
                      ? "Your next chapter starts with a few details."
                      : "Sign in and pick up where your ambition left off."}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Authentication form */}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* Full name */}

              <AnimatePresence initial={false}>
                {isRegister && (
                  <motion.div
                    key="name"
                    initial={
                      shouldReduceMotion
                        ? false
                        : { opacity: 0, height: 0, y: -8 }
                    }
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={
                      shouldReduceMotion
                        ? undefined
                        : { opacity: 0, height: 0, y: -8 }
                    }
                    transition={{ duration: motionDuration }}
                    className="overflow-hidden"
                  >
                    <label
                      htmlFor="name"
                      className="mb-2 flex items-center gap-2 text-[11px] font-bold text-wine-dark"
                    >
                      <UserRound size={14} />
                      Full name
                    </label>

                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        if (submitted) {
                          updateError("name", validateName(event.target.value));
                        }
                      }}
                      onBlur={() => validateField("name", name)}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      minLength={2}
                      maxLength={80}
                      required
                      disabled={busy}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? "name-error" : undefined}
                      className={inputClass(Boolean(errors.name))}
                    />

                    {errors.name && (
                      <p
                        id="name-error"
                        role="alert"
                        className="mt-2 flex items-center gap-1.5 text-[10px] text-red-600"
                      >
                        <XCircle size={13} />
                        {errors.name}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 flex items-center gap-2 text-[11px] font-bold text-wine-dark"
                >
                  <Mail size={14} />
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (submitted) {
                      updateError("email", validateEmail(event.target.value));
                    }
                  }}
                  onBlur={() => validateField("email", email)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  maxLength={254}
                  required
                  disabled={busy}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={inputClass(Boolean(errors.email))}
                />

                {errors.email && (
                  <p
                    id="email-error"
                    role="alert"
                    className="mt-2 flex items-center gap-1.5 text-[10px] text-red-600"
                  >
                    <XCircle size={13} />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 flex items-center gap-2 text-[11px] font-bold text-wine-dark"
                >
                  <LockKeyhole size={14} />
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (submitted) {
                        updateError(
                          "password",
                          validatePassword(event.target.value)
                        );
                      }
                    }}
                    onBlur={() => validateField("password", password)}
                    placeholder="Enter your password"
                    autoComplete={
                      isRegister ? "new-password" : "current-password"
                    }
                    minLength={8}
                    maxLength={128}
                    required
                    disabled={busy}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    className={`${inputClass(Boolean(errors.password))} pr-12`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    disabled={busy}
                    className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-wine-soft hover:text-wine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine"
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p
                    id="password-error"
                    role="alert"
                    className="mt-2 flex items-center gap-1.5 text-[10px] text-red-600"
                  >
                    <XCircle size={13} />
                    {errors.password}
                  </p>
                )}

                {/* Password strength - registration only */}

                {isRegister && password.length > 0 && (
                  <div className="mt-3 rounded-xl border border-border bg-sand-light/70 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-wine-dark">
                        Password strength
                      </span>

                      <span className="text-[10px] font-bold text-muted">
                        {getPasswordStrengthLabel(passwordStrength)}
                      </span>
                    </div>

                    <div
                      className="grid grid-cols-4 gap-1.5"
                      aria-label={`Password strength: ${getPasswordStrengthLabel(
                        passwordStrength
                      )}`}
                    >
                      {passwordRules.map((rule, index) => (
                        <div
                          key={rule.label}
                          className={`h-1.5 rounded-full transition-colors duration-200 ${
                            index < passwordStrength
                              ? getPasswordStrengthColor(passwordStrength)
                              : "bg-border"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                      {passwordRules.map((rule) => {
                        const passed = rule.test(password);

                        return (
                          <div
                            key={rule.label}
                            className={`flex items-center gap-1.5 text-[9px] ${
                              passed ? "text-emerald-700" : "text-muted"
                            }`}
                          >
                            {passed ? (
                              <Check size={12} />
                            ) : (
                              <span className="h-3 w-3 rounded-full border border-border" />
                            )}
                            {rule.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isRegister && password.length === 0 && (
                  <p className="mt-2 text-[10px] text-muted">
                    Use at least 8 characters. A stronger password is
                    recommended.
                  </p>
                )}
              </div>

              {/* Account role cards */}

              <AnimatePresence initial={false}>
                {isRegister && (
                  <motion.div
                    key="role"
                    initial={
                      shouldReduceMotion
                        ? false
                        : { opacity: 0, height: 0, y: -8 }
                    }
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={
                      shouldReduceMotion
                        ? undefined
                        : { opacity: 0, height: 0, y: -8 }
                    }
                    transition={{ duration: motionDuration }}
                    className="overflow-hidden"
                  >
                    <div className="mb-3 flex items-center gap-2 text-[11px] font-bold text-wine-dark">
                      <Users size={14} />
                      Choose your account type
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {roles.map((item) => {
                        const Icon = item.icon;
                        const selected = role === item.value;

                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setRole(item.value)}
                            disabled={busy}
                            aria-pressed={selected}
                            className={`group relative flex min-h-[100px] items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine focus-visible:ring-offset-2 ${
                              selected
                                ? "border-wine bg-wine/5 shadow-[0_5px_18px_rgba(91,35,54,0.08)]"
                                : "border-border bg-white/50 hover:border-wine/40 hover:bg-white"
                            }`}
                          >
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                selected
                                  ? "bg-wine text-sand"
                                  : "bg-sand-light text-muted group-hover:text-wine"
                              }`}
                            >
                              <Icon size={18} />
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block text-xs font-extrabold text-wine-dark">
                                {item.title}
                              </span>
                              <span className="mt-1 block text-[10px] leading-5 text-muted">
                                {item.description}
                              </span>
                            </span>

                            <span
                              className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                                selected
                                  ? "border-wine bg-wine text-white"
                                  : "border-border bg-white text-transparent"
                              }`}
                            >
                              <Check size={12} />
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <p className="mt-2 text-[10px] leading-5 text-muted">
                      You can use NexHire according to the account type you
                      select.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login security */}

              {!isRegister && (
                <div className="flex items-center justify-between text-[10px] text-muted">
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-wine" />
                    Secure authentication
                  </span>
                </div>
              )}

              {/* Submit button */}

              <motion.button
                type="submit"
                disabled={busy}
                whileHover={
                  !busy && !shouldReduceMotion ? { y: -2 } : undefined
                }
                whileTap={
                  !busy && !shouldReduceMotion ? { scale: 0.985 } : undefined
                }
                className="group flex min-h-[56px] w-full items-center justify-between rounded-control bg-wine py-2 pl-5 pr-2 text-xs font-bold text-sand-light shadow-wine transition-colors hover:bg-wine-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>
                  {busy
                    ? "Please wait..."
                    : isRegister
                      ? "Create my account"
                      : "Sign in to NexHire"}
                </span>

                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sand text-wine transition-transform group-hover:translate-x-1">
                  {busy ? (
                    <span
                      className={`inline-flex h-4 w-4 rounded-full border-2 border-wine/30 border-t-wine ${
                        shouldReduceMotion ? "" : "animate-spin"
                      }`}
                    />
                  ) : (
                    <ArrowRight size={18} />
                  )}
                </span>
              </motion.button>
            </form>

            {/* Divider */}

            <div className="my-7 flex items-center gap-3 sm:my-8">
              <span className="h-px flex-1 bg-border" />

              <span className="whitespace-nowrap text-[8px] font-bold tracking-[1.5px] text-subtle">
                YOUR CAREER STARTS HERE
              </span>

              <span className="h-px flex-1 bg-border" />
            </div>

            {/* Security message */}

            <div className="flex items-center justify-center gap-2 text-[10px] text-muted">
              <ShieldCheck size={15} className="text-wine" />
              Your information stays protected.
            </div>

            {/* Terms */}

            <p className="mx-auto mt-6 max-w-xs text-center text-[9px] leading-6 text-subtle">
              By continuing, you agree to NexHire's{" "}
              <Link
                to="/terms"
                className="font-bold text-wine underline underline-offset-2 transition-colors hover:text-wine-dark"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="font-bold text-wine underline underline-offset-2 transition-colors hover:text-wine-dark"
              >
                Privacy Policy
              </Link>.
            </p>
          </motion.div>

          {/* Bottom footer */}

          <footer className="flex items-center justify-between gap-3 text-[8px] font-bold tracking-[1px] text-subtle">
            <span>MADE FOR THE NEXT GENERATION.</span>
            <span>CHENNAI · INDIA</span>
          </footer>
        </section>
      </div>
    </main>
  );
}
