"use client";

import { BRAND_ADMIN_NAME } from "@/constants";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUiStore } from "@/hooks/useUiStore";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useUiStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const redirect = searchParams.get("redirect") ?? "/admin/dashboard";
      router.push(redirect);
      router.refresh();
    } catch {
      showToast("Invalid email or password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="v18-login-bg flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo href="/" priority className="mb-4" />
          <h1 className="sr-only">{BRAND_ADMIN_NAME}</h1>
          <p className="text-sm text-slate-500">Sign in to manage your store</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="v18-login-btn h-11 w-full"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
