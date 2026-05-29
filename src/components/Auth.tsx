/**
 * Authentic Authentication layout with full-stack JWT validation.
 * Redesigned in soft light-pastel hues.
 */

import React, { useState } from "react";
import { User, Lock, ArrowRight, Film, ShieldAlert, Sparkles, KeyRound } from "lucide-react";
import { UserSession } from "../types";

interface AuthProps {
  onLoginSuccess: (session: UserSession, token: string) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim() || !password.trim()) {
      setError("Please complete both username and password fields.");
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication request failed.");
      }

      if (isLogin) {
        setSuccess(`Welcome back, ${data.user.username}! Authorized!`);
        setTimeout(() => {
          onLoginSuccess(data.user, data.token);
        }, 1000);
      } else {
        setSuccess("Account registered! Proceeding to automatic authorization check...");
        // Auto sign-in right after registration
        setTimeout(async () => {
          try {
            const loginRes = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: username.trim(), password }),
            });
            const loginData = await loginRes.json();
            if (loginRes.ok) {
              onLoginSuccess(loginData.user, loginData.token);
            } else {
              setIsLogin(true);
              setSuccess("");
              setError("Registration succeeded. Please enter credentials below to authorize.");
            }
          } catch (e) {
            setIsLogin(true);
          }
        }, 1200);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Endpoint connection failure. Check servers.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Establish or retrieve the secure demo guest account in database
      const regResp = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "CineGuest", password: "password123" }),
      });
      // Ignore conflict errors safely (if user already exists)
    } catch (e) {}

    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "CineGuest", password: "password123" }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setSuccess("Connected as guest user. Resolving local mock...");
        setTimeout(() => {
          onLoginSuccess(data.user, data.token);
        }, 800);
      } else {
        throw new Error("Could not log in CineGuest");
      }
    } catch (err: any) {
      setError("Guest authorization failed. Please register manually.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 font-sans" id="auth-container">
      {/* Background soft pastel ambient blur spots */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-80 select-none pointer-events-none">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-violet-100/50 dark:bg-violet-900/10 blur-[130px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-sky-200/40 dark:bg-sky-900/10 blur-[130px]" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6" id="auth-card-wrapper">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-400 to-purple-400 shadow-lg shadow-indigo-200 dark:shadow-none mb-4 animate-scaleUp">
            <Film className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white leading-tight">
            {isLogin ? "Welcome to CineMatch" : "Create Film Profile"}
          </h2>
          <p className="mt-2.5 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {isLogin
              ? "Discover hand-curated movies matched to your unique cinematic preferences."
              : "Register to initialize watchlists and personalize your film profile."}
          </p>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-8 shadow-xl dark:shadow-none" id="auth-form-card">
          <form className="space-y-4.5" onSubmit={handleSubmit}>
            
            {error && (
              <div className="flex items-start space-x-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-3.5 rounded-xl animate-fadeIn" id="auth-error-msg">
                <ShieldAlert className="h-4.5 w-4.5 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start space-x-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl animate-fadeIn" id="auth-success-msg">
                <span className="shrink-0">✨</span>
                <span>{success}</span>
              </div>
            )}

            {/* Username */}
            <div className="space-y-1">
              <label htmlFor="username-input" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                Username Identifier
              </label>
              <div className="relative rounded-xl shadow-inner dark:shadow-none">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-550">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username-input"
                  type="text"
                  required
                  disabled={loading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. celluloid_fan"
                  className="block w-full rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 py-3 pl-10 pr-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label htmlFor="password-input" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                Secret Password
              </label>
              <div className="relative rounded-xl shadow-inner dark:shadow-none">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-550">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password-input"
                  type="password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 py-3 pl-10 pr-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200"
                />
              </div>
            </div>

            <button
              id="submit-auth-btn"
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center space-x-2 rounded-xl bg-indigo-500 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-indigo-100 hover:bg-indigo-600 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? "Authorizing..." : (isLogin ? "Sign In" : "Register Profile")}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Toggle login / signup */}
          <div className="mt-6 flex items-center justify-center space-x-1.5 border-t border-slate-100 dark:border-slate-800 pt-5 text-xs" id="auth-toggle-wrapper">
            <span className="text-slate-400 dark:text-slate-550">
              {isLogin ? "New to CineMatch?" : "Already registered?"}
            </span>
            <button
              id="auth-toggle-btn"
              type="button"
              disabled={loading}
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setSuccess("");
              }}
              className="font-bold text-indigo-550 dark:text-indigo-450 hover:text-indigo-650 dark:hover:text-indigo-350 transition-colors cursor-pointer"
            >
              {isLogin ? "Create Account" : "Access Login"}
            </button>
          </div>
        </div>

        {/* Demo Fast Access Option */}
        <div className="rounded-[2rem] border border-dashed border-indigo-200 dark:border-slate-800 bg-indigo-50/30 dark:bg-indigo-950/10 p-5 text-center" id="demo-access-card">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
            Want to skip manual setup? Connect instantly to view high-performance AI movie recommendations and taste dashboards!
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={handleDemoAccess}
            className="inline-flex items-center space-x-2 rounded-xl border border-indigo-250 dark:border-slate-800 bg-indigo-500/5 px-5 py-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 dark:hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer font-mono"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-550 dark:text-indigo-400" />
            <span>Fast Guest Demo Setup</span>
          </button>
        </div>
      </div>
    </div>
  );
}
