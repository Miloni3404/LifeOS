"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/store";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAppSelector((s) => s.auth);
  const redirected = useRef(false);

  // mounted ensures server and client render the SAME thing on first paint (null)
  // Only AFTER mount do we show the loader or children
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated && !redirected.current) {
      redirected.current = true;
      router.replace("/auth/login");
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  // Server + client first paint = identical null → no hydration mismatch
  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900" style={{ zIndex: 9999 }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading your LifeOS...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}