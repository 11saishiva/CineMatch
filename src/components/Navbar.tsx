/**
 * Beautiful Pastel Style Header / Navbar
 * Integrates light-glass blur effects and Roboto display typography.
 */

import React from "react";
import { Film, User, LogOut, Compass, ClipboardList, BarChart, BookOpen } from "lucide-react";
import { UserSession } from "../types";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserSession | null;
  onLogout: () => void;
}

export default function Navbar({ activeTab, setActiveTab, user, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-indigo-100 bg-white/70 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo and Brand */}
        <div 
          className="flex cursor-pointer items-center space-x-3 group" 
          onClick={() => setActiveTab("home")}
          id="nav-logo"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500 shadow-md shadow-indigo-100 transition-transform group-hover:scale-102">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
          <span className="text-xl font-black tracking-tight text-slate-800 font-display">
            CineMatch<span className="text-indigo-500 font-extrabold">.</span>
          </span>
        </div>

        {/* Navigation Items */}
        {user && (
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 text-[11px] font-bold uppercase tracking-wider" id="nav-desktop-tabs">
            <button
              id="tab-home"
              onClick={() => setActiveTab("home")}
              className={`flex items-center space-x-1.5 pb-1 transition-all cursor-pointer ${
                activeTab === "home"
                  ? "text-indigo-650 border-b-2 border-indigo-500"
                  : "text-slate-500 hover:text-indigo-500"
              }`}
            >
              <Compass className="h-4 w-4" />
              <span>Discover</span>
            </button>

            <button
              id="tab-quiz"
              onClick={() => setActiveTab("quiz")}
              className={`flex items-center space-x-1.5 pb-1 transition-all cursor-pointer ${
                activeTab === "quiz"
                  ? "text-indigo-650 border-b-2 border-indigo-500"
                  : "text-slate-500 hover:text-indigo-500"
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              <span>Taste Quiz</span>
            </button>

            <button
              id="tab-watchlist"
              onClick={() => setActiveTab("watchlist")}
              className={`flex items-center space-x-1.5 pb-1 transition-all cursor-pointer ${
                activeTab === "watchlist"
                  ? "text-indigo-650 border-b-2 border-indigo-500"
                  : "text-slate-500 hover:text-indigo-500"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>My Library</span>
            </button>

            <button
              id="tab-profile"
              onClick={() => setActiveTab("profile")}
              className={`flex items-center space-x-1.5 pb-1 transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "text-indigo-650 border-b-2 border-indigo-500"
                  : "text-slate-500 hover:text-indigo-500"
              }`}
            >
              <BarChart className="h-4 w-4" />
              <span>Profile</span>
            </button>
          </nav>
        )}

        {/* User Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4" id="nav-actions">
          
          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div 
                onClick={() => setActiveTab("profile")}
                className="flex cursor-pointer items-center space-x-2 rounded-full border border-slate-100 bg-slate-50 hover:bg-indigo-50/50 py-1 pl-1.5 pr-3 hover:border-indigo-200 transition-colors"
                id="user-profile-badge"
              >
                <div className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-400 to-purple-400 text-[10px] font-black text-white uppercase text-center shadow-inner">
                  {user.username.slice(0, 2)}
                </div>
                <span className="text-xs font-semibold text-slate-650">
                  {user.username}
                </span>
              </div>

              <button
                id="logout-btn"
                onClick={onLogout}
                className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-100 text-slate-400 hover:border-rose-200 hover:text-rose-505 hover:bg-rose-50 transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              id="login-redirect-btn"
              onClick={() => setActiveTab("auth")}
              className="flex items-center space-x-1.5 rounded-2xl bg-indigo-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-indigo-100 hover:bg-indigo-600 transition-colors cursor-pointer"
            >
              <User className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation bar */}
      {user && (
        <div className="md:hidden flex border-t border-indigo-50 bg-white/90 justify-around py-2 px-1 animate-fadeIn" id="nav-mobile-bottom">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === "home" ? "text-indigo-500" : "text-slate-400"
            }`}
          >
            <Compass className="h-4 w-4" />
            <span className="text-[9px] mt-0.5 font-bold uppercase tracking-wider">Discover</span>
          </button>
          
          <button
            onClick={() => setActiveTab("quiz")}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === "quiz" ? "text-indigo-500" : "text-slate-400"
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span className="text-[9px] mt-0.5 font-bold uppercase tracking-wider">Quiz</span>
          </button>

          <button
            onClick={() => setActiveTab("watchlist")}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === "watchlist" ? "text-indigo-500" : "text-slate-400"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span className="text-[9px] mt-0.5 font-bold uppercase tracking-wider">Library</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === "profile" ? "text-indigo-500" : "text-slate-400"
            }`}
          >
            <BarChart className="h-4 w-4" />
            <span className="text-[9px] mt-0.5 font-bold uppercase tracking-wider">Profile</span>
          </button>
        </div>
      )}

    </header>
  );
}
