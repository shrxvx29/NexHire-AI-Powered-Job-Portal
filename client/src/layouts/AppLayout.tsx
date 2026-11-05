
import { useEffect, useRef, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  BriefcaseBusiness,
  Building2,
  Clock3,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Brand from "../components/Brand";
import toast from "react-hot-toast";

const seekerLinks = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/jobs", label: "Find jobs", icon: Search },
  { to: "/applications", label: "My applications", icon: FileText },
  { to: "/ai", label: "AI career tools", icon: Sparkles },
  { to: "/profile", label: "My profile", icon: UserRound },
];

const employerLinks = [
  { to: "/employer", label: "Overview", icon: LayoutDashboard },
  { to: "/employer/jobs", label: "Manage jobs", icon: BriefcaseBusiness },
  { to: "/employer/jobs/new", label: "Post a job", icon: Building2 },
  { to: "/employer/profile", label: "Company profile", icon: Building2 },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  );

  const sidebarRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const isEmployer = user?.role === "employer";
  const links = isEmployer ? employerLinks : seekerLinks;

  const activeLink = [...links]
    .sort((a, b) => b.to.length - a.to.length)
    .find(
      (link) =>
        location.pathname === link.to ||
        location.pathname.startsWith(`${link.to}/`)
    );

  const closeMobileMenu = () => {
    setMobileOpen(false);
    menuButtonRef.current?.focus();
  };

  const signOut = async () => {
    try {
      await logout();
      setMobileOpen(false);
      toast.success("Signed out successfully");
      navigate("/login", { replace: true });
    } catch {
      toast.error("Unable to sign out. Please try again.");
    }
  };

  // Live clock: updates every second.
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };

    updateTime();

    const intervalId = window.setInterval(updateTime, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  // Close mobile navigation after route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Mobile sidebar accessibility: focus, Escape, Tab trap and scroll lock.
  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobileMenu();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements =
        sidebarRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

      if (!focusableElements?.length) return;

      const visibleElements = Array.from(focusableElements).filter(
        (element) => element.offsetParent !== null
      );

      if (!visibleElements.length) return;

      const firstElement = visibleElements[0];
      const lastElement = visibleElements[visibleElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-sand md:flex">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 cursor-default bg-ink/50 backdrop-blur-sm transition-opacity duration-300 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        id="app-sidebar"
        aria-label="Main navigation"
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen ? true : undefined}
        className={`
          fixed inset-y-0 left-0 z-50 flex h-screen w-[280px]
          shrink-0 flex-col border-r border-border bg-sand-light
          shadow-xl shadow-ink/5
          transition-transform duration-300 ease-in-out
          md:sticky md:top-0 md:translate-x-0 md:shadow-none
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* Brand */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-border px-6">
          <Brand />

          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeMobileMenu}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-control text-muted transition-all duration-200 hover:bg-wine-soft hover:text-wine active:scale-95 md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-7">
          <p className="mb-4 px-3 text-[10px] font-extrabold tracking-[2px] text-subtle">
            WORKSPACE
          </p>

          <nav aria-label="Workspace navigation" className="space-y-1.5">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/dashboard" || to === "/employer"}
                onClick={() => {
                  if (mobileOpen) closeMobileMenu();
                }}
                className={({ isActive }) => `
                  group relative flex min-h-11 items-center gap-3
                  overflow-hidden rounded-control px-3.5 py-3
                  text-[13px] font-semibold
                  transition-all duration-200 ease-out
                  ${
                    isActive
                      ? "bg-wine text-sand-light shadow-wine"
                      : "text-muted hover:translate-x-0.5 hover:bg-wine-soft hover:text-wine"
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-sand-light" />
                    )}

                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.3 : 2}
                      className="shrink-0 transition-transform duration-200 group-hover:scale-105"
                    />

                    <span>{label}</span>

                    <ChevronRight
                      size={15}
                      className={`ml-auto transition-all duration-200 ${
                        isActive
                          ? "translate-x-0 opacity-70"
                          : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60"
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar bottom */}
        <div className="shrink-0 border-t border-border p-4">
          {!isEmployer && (
            <div className="mb-5 overflow-hidden rounded-card border border-wine/10 bg-wine-soft p-4 transition-all duration-200 hover:border-wine/25 hover:shadow-md">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-wine text-sand transition-transform duration-200 hover:scale-105">
                <Sparkles size={17} />
              </div>

              <h3 className="font-heading text-sm font-extrabold text-ink">
                Need a career boost?
              </h3>

              <p className="mt-1.5 text-xs leading-5 text-muted">
                Get tailored guidance from your AI career assistant.
              </p>

              <NavLink
                to="/ai"
                onClick={() => {
                  if (mobileOpen) closeMobileMenu();
                }}
                className="mt-3 inline-flex items-center gap-2 text-xs font-extrabold text-wine transition-all duration-200 hover:gap-3 hover:text-wine-dark"
              >
                Explore AI tools
                <span aria-hidden="true">→</span>
              </NavLink>
            </div>
          )}

          {/* Sign out */}
          <button
            type="button"
            onClick={signOut}
            className="group flex w-full items-center gap-3 rounded-control px-3.5 py-3 text-left text-[13px] font-semibold text-muted transition-all duration-200 hover:bg-danger-soft hover:text-danger active:scale-[0.99]"
          >
            <LogOut
              size={18}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            Sign out
          </button>

          {/* User profile */}
          <NavLink
            to={isEmployer ? "/employer/profile" : "/profile"}
            onClick={() => {
              if (mobileOpen) closeMobileMenu();
            }}
            className="group mt-3 flex items-center gap-3 rounded-control border-t border-border px-2 pt-4 transition-colors duration-200 hover:bg-wine-soft/60"
          >
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-wine/15 bg-wine shadow-sm transition-transform duration-200 group-hover:scale-105">
              {user?.profilePictureUrl ? (
                <img
                  src={user.profilePictureUrl}
                  alt={`${user.name || "User"} profile`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-extrabold uppercase text-sand">
                  {user?.name?.charAt(0) || "U"}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">
                {user?.name || "User"}
              </p>
              <p className="mt-0.5 text-[11px] capitalize text-muted">
                {isEmployer ? "Employer" : "Job seeker"}
              </p>
            </div>

            <ChevronRight
              size={15}
              className="shrink-0 text-subtle opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
            />
          </NavLink>
        </div>
      </aside>

      {/* Main workspace */}
      <div className="min-h-screen min-w-0 flex-1">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-border bg-sand-light/90 px-4 backdrop-blur-xl sm:px-6 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              aria-controls="app-sidebar"
              aria-expanded={mobileOpen}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-border text-ink transition-all duration-200 hover:border-wine/30 hover:bg-wine-soft hover:text-wine active:scale-95 md:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="flex min-w-0 items-center gap-2 text-xs sm:text-sm">
              <span className="hidden text-muted sm:inline">
                Workspace
              </span>
              <span className="hidden text-subtle sm:inline">/</span>
              <span className="truncate font-bold text-ink">
                {activeLink?.label || "Workspace"}
              </span>
            </div>
          </div>

          {/* Live clock */}
          <div
            className="flex shrink-0 items-center gap-2 rounded-control border border-border bg-sand px-3 py-2"
            aria-label={`Current time ${currentTime}`}
            title="Live local time"
          >
            <Clock3 size={15} className="text-wine" />
            <time
              className="min-w-[100px] font-mono text-xs font-bold tabular-nums text-ink sm:text-sm"
              aria-live="off"
            >
              {currentTime}
            </time>
            <span className="relative ml-0.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-9 lg:py-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
