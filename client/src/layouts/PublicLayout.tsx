
import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  ChevronRight,
  FileText,
  Info,
  Mail,
  Menu,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import Brand from "../components/Brand";
import { useAuth } from "../context/AuthContext";

export default function PublicLayout() {
  const { user } = useAuth();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const workspacePath =
    user?.role === "employer" ? "/employer" : "/dashboard";

  const profilePath =
    user?.role === "employer" ? "/employer/profile" : "/profile";

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  // Detect page scrolling for navbar shadow.
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close mobile navigation after route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Escape key and body scroll lock.
  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  const navigationLinks = [
    {
      to: "/jobs",
      label: "Find jobs",
    },
  ];

  const footerLinks = [
    {
      title: "Explore",
      links: [
        { label: "Find jobs", to: "/jobs", icon: BriefcaseBusiness },
        { label: "Sign in", to: "/login", icon: UserRound },
        { label: "Get started", to: "/register", icon: ArrowRight },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About NexHire", to: "/about", icon: Info },
        { label: "Contact", to: "/contact", icon: Mail },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", to: "/privacy", icon: ShieldCheck },
        { label: "Terms of Service", to: "/terms", icon: FileText },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-sand">

      {/* ================= HEADER ================= */}

      <header
        className={`
          sticky top-0 z-40 border-b border-border
          bg-sand-light/90 backdrop-blur-xl
          transition-shadow duration-300
          ${
            scrolled
              ? "shadow-lg shadow-ink/[0.04]"
              : "shadow-none"
          }
        `}
      >
        <div className="mx-auto flex h-[76px] w-full max-w-[1440px] items-center justify-between px-4 sm:px-8 lg:px-10">

          {/* Brand */}
          <Link
            to="/"
            aria-label="NexHire home"
            onClick={closeMobileMenu}
            className="shrink-0 rounded-sm outline-none transition-opacity duration-200 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-wine focus-visible:ring-offset-4"
          >
            <Brand />
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-7 md:flex"
          >
            {navigationLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `
                  group relative py-2 text-sm font-bold
                  transition-colors duration-200
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-wine focus-visible:ring-offset-4
                  ${
                    isActive
                      ? "text-wine"
                      : "text-muted hover:text-wine"
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    {item.label}

                    <span
                      className={`
                        absolute -bottom-0.5 left-0 h-[2px]
                        rounded-full bg-wine
                        transition-all duration-200
                        ${
                          isActive
                            ? "w-full"
                            : "w-0 group-hover:w-full"
                        }
                      `}
                    />
                  </>
                )}
              </NavLink>
            ))}

            {user ? (
              <>
                {/* Profile shortcut */}
                <Link
                  to={profilePath}
                  aria-label="Open your profile"
                  className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-sand text-wine transition-all duration-200 hover:border-wine/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine focus-visible:ring-offset-2"
                >
                  {user.profilePictureUrl ? (
                    <img
                      src={user.profilePictureUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-extrabold uppercase">
                      {user.name?.charAt(0) || "U"}
                    </span>
                  )}
                </Link>

                {/* Workspace CTA */}
                <Link
                  to={workspacePath}
                  className="nx-button nx-button-primary group inline-flex min-h-10 items-center gap-2 px-5 text-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                >
                  Open workspace
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-sm text-sm font-bold text-muted transition-colors duration-200 hover:text-wine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine focus-visible:ring-offset-4"
                >
                  Sign in
                </Link>

                <Link
                  to="/register"
                  className="nx-button nx-button-primary group inline-flex min-h-10 items-center gap-2 px-5 text-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                >
                  Get started
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            type="button"
            aria-label={
              mobileOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-menu"
            onClick={() => setMobileOpen((previous) => !previous)}
            className="flex h-10 w-10 items-center justify-center rounded-control border border-border text-ink transition-all duration-200 hover:border-wine/30 hover:bg-wine-soft hover:text-wine active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine focus-visible:ring-offset-2 md:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* ================= MOBILE NAVIGATION ================= */}

        <div
          id="public-mobile-menu"
          aria-hidden={!mobileOpen}
          className={`
            overflow-hidden border-t border-border bg-sand-light
            transition-all duration-300 ease-in-out md:hidden
            ${
              mobileOpen
                ? "max-h-[480px] opacity-100"
                : "pointer-events-none max-h-0 opacity-0"
            }
          `}
        >
          <nav
            aria-label="Mobile navigation"
            className="mx-auto flex max-w-[1440px] flex-col gap-1 px-4 py-4 sm:px-8"
          >
            <NavLink
              to="/jobs"
              onClick={closeMobileMenu}
              className={({ isActive }) => `
                flex items-center justify-between rounded-control px-4 py-3
                text-sm font-bold transition-colors duration-200
                ${
                  isActive
                    ? "bg-wine-soft text-wine"
                    : "text-muted hover:bg-wine-soft hover:text-wine"
                }
              `}
            >
              Find jobs
              <ChevronRight size={16} />
            </NavLink>

            {user ? (
              <>
                <Link
                  to={profilePath}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 rounded-control px-4 py-3 text-sm font-bold text-muted transition-colors duration-200 hover:bg-wine-soft hover:text-wine"
                >
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-wine text-sand">
                    {user.profilePictureUrl ? (
                      <img
                        src={user.profilePictureUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold uppercase">
                        {user.name?.charAt(0) || "U"}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">
                      {user.name || "User"}
                    </p>
                    <p className="text-[11px] font-medium text-muted">
                      {user.role === "employer" ? "Employer" : "Job seeker"}
                    </p>
                  </div>

                  <ChevronRight size={16} />
                </Link>

                <Link
                  to={workspacePath}
                  onClick={closeMobileMenu}
                  className="nx-button nx-button-primary mt-2 flex min-h-11 items-center justify-center gap-2 text-xs"
                >
                  Open workspace
                  <ArrowRight size={15} />
                </Link>
              </>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-4">
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="flex min-h-11 items-center justify-center rounded-control border border-border text-sm font-bold text-muted transition-colors hover:bg-wine-soft hover:text-wine"
                >
                  Sign in
                </Link>

                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="nx-button nx-button-primary flex min-h-11 items-center justify-center gap-2 text-xs"
                >
                  Get started
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* ================= PAGE CONTENT ================= */}

      <main
        id="main-content"
        className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-8 sm:py-12 lg:px-10"
      >
        <Outlet />
      </main>

      {/* ================= FOOTER ================= */}

      <footer className="border-t border-border bg-sand-light">

        {/* Footer main */}
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-2 gap-9 px-5 py-10 sm:px-8 md:grid-cols-4 md:py-14 lg:px-10">

          {/* Brand section */}
          <div className="col-span-2 md:col-span-1">
            <Link
              to="/"
              aria-label="NexHire home"
              className="inline-flex rounded-sm outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-wine"
            >
              <Brand />
            </Link>

            <p className="mt-4 max-w-[260px] text-xs leading-6 text-muted">
              Connecting ambitious people with opportunities that move
              their careers forward.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-wine/10 bg-wine-soft px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span className="text-[10px] font-bold text-wine">
                Built for better careers
              </span>
            </div>
          </div>

          {/* Footer link groups */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 text-[11px] font-extrabold tracking-[1.5px] text-ink">
                {section.title.toUpperCase()}
              </h3>

              <ul className="space-y-3">
                {section.links.map(({ label, to }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="inline-flex items-center gap-2 text-xs font-medium text-muted transition-all duration-200 hover:translate-x-1 hover:text-wine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine focus-visible:ring-offset-2"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="border-t border-border">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-2 px-5 py-5 text-center sm:px-8 md:flex-row md:text-left lg:px-10">
            <p className="text-[11px] text-muted">
              © {new Date().getFullYear()} NexHire. All rights reserved.
            </p>

            <p className="text-[11px] font-medium text-subtle">
              Find work that moves you forward.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
