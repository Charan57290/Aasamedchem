"use client";

import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Shield, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect accordingly
  useEffect(() => {
    if (status === "authenticated" && session) {
      if (session.user.role === "ADMIN") {
        router.replace("/admin/products");
      } else {
        router.replace("/dashboard/products");
      }
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Logging you in...");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      toast.dismiss(loadingToast);

      if (res?.error) {
        toast.error(res.error || "Invalid credentials.");
      } else {
        toast.success("Successfully logged in!");
        // The useEffect above will handle redirection
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error("An error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
          <p className="text-slate-400 text-sm">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden px-4">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md bg-slate-900/40 backdrop-blur-md border-slate-800 shadow-2xl relative z-10">
        <CardHeader className="space-y-2 text-center pt-8">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-teal-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Shield className="h-6 w-6 text-slate-950 font-bold" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
            Asa Medchem
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            Inventory & Order Management System
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                <Input
                  type="email"
                  placeholder="name@company.com"
                  className="pl-10 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-teal-500 focus-visible:ring-offset-slate-950"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-teal-500 focus-visible:ring-offset-slate-950"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold transition-all duration-200 shadow-lg shadow-teal-500/10 mt-6"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing In...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Seed accounts helper hint */}
          <div className="mt-8 p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-400 space-y-1.5">
            <p className="font-semibold text-slate-300">Test Accounts:</p>
            <div className="flex justify-between items-center">
              <span>Admin: <strong className="text-teal-400">admin@test.com</strong> / admin123</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 text-teal-400 border-teal-500/20 bg-teal-500/5">ADMIN</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Seller: <strong className="text-emerald-400">seller@test.com</strong> / seller123</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 text-emerald-400 border-emerald-500/20 bg-emerald-500/5">SELLER</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
