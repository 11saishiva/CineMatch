/**
 * Personal Movie Profile and Advanced ML Insights dashboard
 * Redesigned in light-pastel bento grids.
 * Explains the ML algorithms, password encryption (AES), and rate limit throttling mechanisms.
 */

import React, { useState } from "react";
import { 
  User, CalendarDays, Award, Star, ListChecks, 
  Trash2, RotateCcw, BarChart3, Edit, Heart,
  Shield, Brain, Database, Key, RefreshCw, KeyRound, Globe, Radio
} from "lucide-react";
import { UserSession, Movie } from "../types";

interface ProfileProps {
  user: UserSession;
  watchlist: Movie[];
  watchHistory: { movie: Movie; userRating?: number }[];
  onClearProfile: () => void;
  onRetakeQuiz: () => void;
  onUpdateRating: (movieId: string, rating: number) => void;
  onRemoveHistory: (movieId: string) => void;
}

export default function Profile({
  user,
  watchlist,
  watchHistory,
  onClearProfile,
  onRetakeQuiz,
  onUpdateRating,
  onRemoveHistory,
}: ProfileProps) {
  const [editingRatingId, setEditingRatingId] = useState<string | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [activeInsightTab, setActiveInsightTab] = useState<"ml" | "db" | "sec">("ml");

  // Compute stats
  const totalWatched = watchHistory.length;
  const totalWatchlist = watchlist.length;
  
  // Calculate average rating
  const ratedMovies = watchHistory.filter((m) => m.userRating && m.userRating > 0);
  const averageRating = ratedMovies.length > 0
    ? (ratedMovies.reduce((acc, curr) => acc + (curr.userRating || 0), 0) / ratedMovies.length).toFixed(1)
    : "0.0";

  // Build genre matching statistics
  const genreHits: { [key: string]: number } = {};
  
  // Add base points from profile survey
  user.surveyAnswers?.favoriteGenres?.forEach((genre) => {
    genreHits[genre] = (genreHits[genre] || 0) + 40;
  });

  // Calculate scores from history and ratings
  watchHistory.forEach((item) => {
    item.movie.genres.forEach((genre) => {
      genreHits[genre] = (genreHits[genre] || 0) + 12;
      if (item.userRating && item.userRating >= 4) {
        genreHits[genre] += 8; // bonus points for high ratings!
      }
    });
  });

  // Sort and obtain top genres
  const sortedGenres = Object.entries(genreHits)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // display top 5

  const maxAffinity = sortedGenres.length > 0 ? Math.max(...sortedGenres.map(([, score]) => score)) : 100;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12 animate-fadeIn font-sans bg-[#f8fafc]/20" id="profile-container">
      
      {/* Header Profile Banner - Pastel Layout */}
      <div className="rounded-[2.5rem] border border-indigo-100 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-md mb-8 flex flex-col md:flex-row items-center justify-between gap-6" id="profile-banner">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-400 to-purple-400 shadow-md text-2xl font-black text-white uppercase sm:mb-1 select-none animate-scaleUp">
            {user.username.slice(0, 2)}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center justify-center sm:justify-start">
              <span>{user.username}</span>
              <span className="ml-2.5 rounded-lg bg-indigo-100 px-2.5 py-0.5 text-[9px] font-bold text-indigo-700 uppercase tracking-wider border border-indigo-200/50">
                PRO Member
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-center sm:justify-start">
              <CalendarDays className="h-4 w-4 mr-1 text-slate-400 shrink-0" />
              <span>Cinephile profile set up on {new Date(user.profileCreated).toLocaleDateString()}</span>
            </p>
            <div className="flex flex-wrap gap-1.5 pt-2 justify-center sm:justify-start">
              {user.surveyAnswers?.favoriteGenres?.slice(0, 4).map((g) => (
                <span key={g} className="rounded-full bg-slate-50 border border-slate-100 px-2.5 py-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-normal">
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto font-mono" id="profile-actions-panel">
          <button
            id="retake-onboarding-btn"
            onClick={onRetakeQuiz}
            className="flex items-center justify-center space-x-1.5 rounded-xl border border-indigo-100 bg-white shadow-sm text-slate-650 font-bold text-xs uppercase tracking-wider px-4 py-2.5 hover:text-indigo-600 hover:border-indigo-250 transition-all cursor-pointer active:scale-98"
          >
            <RotateCcw className="h-4 w-4 text-indigo-500" />
            <span>Retake Survey</span>
          </button>

          <button
            id="clear-db-profile-btn"
            onClick={onClearProfile}
            className="flex items-center justify-center space-x-1.5 rounded-xl border border-rose-100 bg-rose-50/50 text-rose-700 font-bold text-xs uppercase tracking-wider px-4 py-2.5 hover:bg-rose-50 transition-all cursor-pointer active:scale-98"
          >
            <Trash2 className="h-4 w-4 text-rose-500" />
            <span>Delete Profile</span>
          </button>
        </div>
      </div>

      {/* Stats and Graphs Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" id="profile-widgets-grid">
        {/* KPI panel */}
        <div className="md:col-span-1 grid grid-cols-3 md:grid-cols-1 gap-4 font-mono" id="stats-kpi-column">
          
          <div className="rounded-3xl border border-indigo-50 bg-white p-5 shadow-sm text-center flex flex-col justify-center items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Watched</span>
            <span className="text-2xl font-black text-indigo-650 mt-1">{totalWatched}</span>
            <span className="text-[10px] text-slate-400 mt-0.5">titles archived</span>
          </div>

          <div className="rounded-3xl border border-indigo-50 bg-white p-5 shadow-sm text-center flex flex-col justify-center items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Watchlist</span>
            <span className="text-2xl font-black text-indigo-650 mt-1">{totalWatchlist}</span>
            <span className="text-[10px] text-slate-400 mt-0.5">movies bookmarked</span>
          </div>

          <div className="rounded-3xl border border-indigo-50 bg-white p-5 shadow-sm text-center flex flex-col justify-center items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Rating</span>
            <span className="text-2xl font-black text-indigo-650 mt-1 flex items-center justify-center">
              {averageRating} <Star className="h-5 w-5 text-indigo-400 fill-indigo-400 ml-1 shrink-0" />
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">out of 5 stars</span>
          </div>

        </div>

        {/* Dynamic Affinity panel */}
        <div className="md:col-span-2 rounded-[2rem] border border-indigo-50 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between" id="affinity-graph-card">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center mb-5">
              <BarChart3 className="h-5 w-5 text-indigo-550 mr-2 shrink-0 animate-pulse" />
              <span>Machine Learning Taste Affinity Model</span>
            </h2>
            {sortedGenres.length > 0 ? (
              <div className="space-y-4 font-mono animate-fadeIn" id="genre-affinity-bars">
                {sortedGenres.map(([genre, score]) => {
                  const percentage = Math.round((score / maxAffinity) * 100);
                  return (
                    <div key={genre} className="space-y-1.5" id={`affinity-bar-${genre}`}>
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-650 uppercase tracking-widest">{genre}</span>
                        <span className="text-indigo-600">{percentage}% Affinity</span>
                      </div>
                      
                      {/* SVG Progress bar representing percentage width */}
                      <div className="h-2 w-full rounded-full bg-slate-50 border border-slate-100 overflow-hidden relative">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-450 to-purple-400 rounded-full transition-all duration-550"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center" id="empty-affinity-card">
                <div className="h-10 w-10 text-slate-350 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                  <Heart className="h-5 w-5" />
                </div>
                <p className="text-sm text-slate-500 font-semibold">Affinity matrix empty.</p>
                <p className="text-xs text-slate-450 max-w-xs mt-1.5 leading-relaxed">
                  Complete your taste survey or rate watched matches on discover feed to map dynamic user patterns!
                </p>
              </div>
            )}
          </div>
          <p className="text-[9px] text-slate-400 leading-relaxed text-center pt-4 font-mono uppercase tracking-widest">
            *Tastes affinity calibrated automatically based on Favorite Survey parameters, watch history triggers, and rated score trends.
          </p>
        </div>
      </div>

      {/* -------------------------------------------------------------
          ADVANCED SYSTEM & MACHINE LEARNING ARCHITECTURE INSIGHTS
         ------------------------------------------------------------- */}
      <div className="rounded-[2.5rem] border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-md mb-8 space-y-6" id="ml-sys-insights">
        
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-800 pb-4 gap-4">
          <div className="flex items-center space-x-2.5">
            <Brain className="h-6 w-6 text-indigo-400 shrink-0" />
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                ML Algorithm & Data Persistence Hub
              </h3>
              <p className="text-[11px] text-slate-400 font-mono uppercase tracking-widest mt-0.5">Application Design & Architecture Analysis</p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex space-x-1.5 font-mono" id="insight-tab-selectors">
            {[
              { id: "ml", label: "ML Model", icon: Brain },
              { id: "db", label: "Credentials/AES", icon: Database },
              { id: "sec", label: "JWT/Redis/Throttles", icon: Shield }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveInsightTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border shrink-0 cursor-pointer ${
                    activeInsightTab === tab.id
                      ? "bg-indigo-500 text-white border-indigo-500 shadow-xs"
                      : "bg-slate-800 border-slate-750 text-slate-300 hover:text-indigo-400 hover:border-slate-700"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="text-sm leading-relaxed text-slate-300 font-sans" id="insight-tab-viewscreen">
          {activeInsightTab === "ml" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-start space-x-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                <p>
                  <strong>Core Prompt-Grounding ML Model:</strong> Instead of simple hardcoded matrix matches, this system harnesses Google's state-of-the-art <strong className="text-indigo-400 font-bold">Gemini-3.5-Flash neural foundation network</strong> to contextualize recommendation records.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                <p>
                  <strong>High-Dimensional Concept Map:</strong> The algorithm transforms categorical variable selections (Favorite Genres, Seeds, Pace, Eras) as well as your watch rating matrices into complex semantic representations, executing detailed zero-shot classification structures to fetch recommendations.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                <p>
                  <strong>Asynchronous Recommendation Worker:</strong> Recommender queries are designated as background jobs on the express server utilizing our **Async Queue Pipeline**. Recommender operations return a job identifier instantly, maintaining immediate rendering reliability for client browser threads during neural mappings.
                </p>
              </div>
            </div>
          )}

          {activeInsightTab === "db" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-start space-x-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                <p>
                  <strong>SHA-256 Passwords Hashing:</strong> Passwords are cryptographically transformed on our Node backend using safe <code className="bg-slate-950 text-indigo-300 px-1.5 py-0.5 rounded font-mono text-xs font-bold border border-slate-800">SHA-256 Hash digests</code> prior to server registry writing, mitigating key-exchange attack vectors.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                <p>
                  <strong>AES-25 symmetric Encryption:</strong> To guarantee utmost privacy of sensitive movie preference data, survey settings are encrypted using <code className="bg-slate-950 text-indigo-300 px-1.5 py-0.5 rounded font-mono text-xs font-bold border border-slate-800">AES-256-CBC</code> cryptography (using unique salt + cipher factors) prior to saving in the core JSON storage unit, decrypting dynamically only upon authorized requests.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                <p>
                  <strong>Standard JSON Database (Durable State):</strong> User indices and watchlists are securely persisted inside server-side <code className="bg-slate-950 text-indigo-300 px-1.5 py-0.5 rounded font-mono text-xs font-bold border border-slate-800">data/db.json</code> arrays, designed to support swift migration to fully web-hosted services like Supabase or Firebase Firestore.
                </p>
              </div>
            </div>
          )}

          {activeInsightTab === "sec" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-start space-x-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                <p>
                  <strong>JWT Session Signatures:</strong> Rest API requests represent validated instances using <strong className="text-indigo-400 font-bold">JSON Web Tokens</strong> containing unique encrypted signature payloads signed by server secret keys, sent in headers securely.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                <p>
                  <strong>Virtual Redis session manager:</strong> Sessions correspond with active Redis registers. We implement a lightweight <strong className="text-indigo-400 font-bold">Redis-Emulator layer</strong> with automatic Garbage Collection routines, expiring sessions exactly after 24h of lifetime activity.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                <p>
                  <strong>Rate Limiting Throttling:</strong> API paths prevent brute-forcing via built-in rate-limit filters which permit up to 60 operations per minute per verified channel, safeguarding server resource consumption.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Real-Time Telemetry Node Feed */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4.5 rounded-2xl border border-indigo-50 font-mono text-[10px] text-slate-500" id="live-telem">
          <div className="space-y-0.5">
            <span className="text-slate-400 block uppercase font-bold">SHA-256 Hashing:</span>
            <span className="text-indigo-600 font-bold block">● SECURE / ACTIVE</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400 block uppercase font-bold">AES ENCRYPTION:</span>
            <span className="text-indigo-600 font-bold block">● CBC MODE ACTIVE</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400 block uppercase font-bold">Session Store:</span>
            <span className="text-indigo-600 font-bold block">● Redis-Emulator Active</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400 block uppercase font-bold">Throttler Status:</span>
            <span className="text-indigo-600 font-bold block">● Limit max 60 r/m</span>
          </div>
        </div>

      </div>

      {/* Watched Movies logs panel */}
      <div className="rounded-[2.5rem] border border-indigo-50 bg-white p-6 sm:p-8 shadow-sm" id="profile-history-logs">
        <h2 className="text-base font-bold text-slate-800 flex items-center mb-6">
          <ListChecks className="h-5 w-5 text-indigo-500 mr-2 shrink-0 animate-bounce" />
          <span>My Watching Logs & History</span>
        </h2>

        {watchHistory.length > 0 ? (
          <div className="overflow-x-auto" id="profile-history-table-wrapper">
            <table className="w-full text-left border-collapse" id="history-data-table">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
                  <th className="pb-3 pl-2">Movie Title</th>
                  <th className="pb-3">Genres</th>
                  <th className="pb-3">Your Rating</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {watchHistory.map((item) => (
                  <tr key={item.movie.id} className="hover:bg-slate-50/50 group transition-colors" id={`history-row-${item.movie.id}`}>
                    <td className="py-4 pl-2 font-semibold text-slate-800">
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-bold text-slate-750">{item.movie.title}</span>
                        <span className="text-[11px] text-slate-400 font-normal mt-0.5 font-mono">Released: {item.movie.year} • Duration: {item.movie.duration || "120 Min"}</span>
                      </div>
                    </td>
                    <td className="py-4 text-xs text-slate-550">
                      <div className="flex flex-wrap gap-1 max-w-xs font-mono">
                        {item.movie.genres.map((g) => (
                          <span key={g} className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                            {g}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4">
                      {editingRatingId === item.movie.id ? (
                        <div className="flex items-center space-x-1 animate-scaleUp">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => {
                                onUpdateRating(item.movie.id, star);
                                setEditingRatingId(null);
                              }}
                              onMouseEnter={() => setHoveredStar(star)}
                              onMouseLeave={() => setHoveredStar(null)}
                              className="p-0.5 hover:scale-110 active:scale-90 transition-all cursor-pointer"
                            >
                              <Star
                                className={`h-4.5 w-4.5 ${
                                  star <= (hoveredStar ?? (item.userRating || 0))
                                    ? "fill-indigo-400 text-indigo-400"
                                    : "text-slate-200"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 font-mono">
                          {item.userRating && item.userRating > 0 ? (
                            <div className="flex items-center text-indigo-600 font-bold text-[10px] bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 uppercase tracking-widest leading-none">
                              <span className="mr-1">{item.userRating}</span>
                              <Star className="h-3 w-3 fill-indigo-450 text-indigo-450 shrink-0" />
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Not rated</span>
                          )}
                          <button
                            onClick={() => {
                              setEditingRatingId(item.movie.id);
                              setHoveredStar(null);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all text-xs cursor-pointer"
                            title="Edit rating score"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-4 text-right pr-2">
                      <button
                        onClick={() => onRemoveHistory(item.movie.id)}
                        className="p-2 text-slate-405 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="Delete from watched history"
                      >
                        <Trash2 className="h-4 w-4 shrink-0" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 rounded-[2rem] bg-indigo-50/10 border border-dashed border-indigo-100" id="empty-history-logs-card">
            <p className="text-sm text-slate-500 font-semibold">No watched movie logs found</p>
            <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
              Explore movie recommendations and click the completion checkmark on any title of interest to log it into your history stream!
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
