import { Navigate, Outlet } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { BriefcaseBusiness, LoaderCircle } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";

type ProtectedRouteProps = {
  role?: UserRole;
};

function RouteLoading() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <main className="flex min-h-screen items-center justify-center bg-sand-light px-5">
      <div className="flex flex-col items-center text-center">
        <motion.div
          animate={shouldReduceMotion ? undefined : { y: [0, -5, 0] }}
          transition={
            shouldReduceMotion
              ? undefined
              : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          }
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-wine text-sand shadow-wine"
        >
          <BriefcaseBusiness size={30} />
        </motion.div>

        <h2 className="font-heading text-xl font-bold text-ink">
          Preparing your workspace
        </h2>

        <p className="mt-2 text-sm text-muted">
          Please wait while we verify your account.
        </p>

        <LoaderCircle
          size={20}
          className="mt-6 animate-spin text-wine"
          aria-label="Loading"
        />
      </div>
    </main>
  );
}

export default function ProtectedRoute({
  role,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <RouteLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    const redirectPath =
      user.role === "employer" ? "/employer" : "/dashboard";

    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
}