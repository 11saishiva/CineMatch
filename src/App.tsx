/**
 * CineMatch Applet Container - Full-Stack JWT & Redis Sessions Integration
 * Features high-contrast pastel styling, asynchronous queue mapping, and server state.
 */

import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Auth from "./components/Auth";
import OnboardingSurvey from "./components/OnboardingSurvey";
import Home from "./components/Home";
import Watchlist from "./components/Watchlist";
import Profile from "./components/Profile";
import { UserSession, Movie, SurveyAnswers } from "./types";

export default function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("auth");
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [watchHistory, setWatchHistory] = useState<{ movie: Movie; userRating?: number }[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [sessionRestored, setSessionRestored] = useState(false);
  // Set dark mode permanently on mount
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    root.classList.add("dark");
    body.classList.add("dark");
    localStorage.setItem("cinematch_theme", "dark");
  }, []);

  // Restore session on mount from server
  useEffect(() => {
    const savedToken = localStorage.getItem("cinematch_jwt_token");
    if (savedToken) {
      setToken(savedToken);
      fetchSession(savedToken);
    } else {
      setActiveTab("auth");
      setSessionRestored(true);
    }
  }, []);

  const fetchSession = async (bearerToken: string) => {
    try {
      const response = await fetch("/api/auth/session", {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      });

      if (response.ok) {
        const decodedSession = await response.json();
        setUser(decodedSession);
        
        // Load watchlist & history from backend server
        loadUserDataFromServer(bearerToken);

        if (decodedSession.surveyAnswers) {
          setActiveTab("home");
        } else {
          setActiveTab("quiz");
        }
      } else {
        // Token stale, clear and default to login
        handleLogout();
      }
    } catch (err) {
      console.error("Failed to restore cloud session:", err);
      handleLogout();
    } finally {
      setSessionRestored(true);
    }
  };

  const loadUserDataFromServer = async (bearerToken: string) => {
    try {
      const response = await fetch("/api/user/data", {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data.watchlist || []);
        setWatchHistory(data.watchedHistory || []);
      }
    } catch (err) {
      console.error("Failed to load secure server profile statistics:", err);
    }
  };

  const syncUserDataToServer = async (
    bearerToken: string | null,
    updatedWatchlist: Movie[],
    updatedHistory: { movie: Movie; userRating?: number }[]
  ) => {
    const currentToken = bearerToken || token;
    if (!currentToken) return;

    try {
      await fetch("/api/user/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          watchlist: updatedWatchlist,
          watchedHistory: updatedHistory,
        }),
      });
    } catch (err) {
      console.error("State synchronization with JWT nodes failed:", err);
    }
  };

  const handleLoginSuccess = (sessionUser: UserSession, sessionToken: string) => {
    setUser(sessionUser);
    setToken(sessionToken);
    localStorage.setItem("cinematch_jwt_token", sessionToken);
    
    // Fetch live synchronized profile details
    loadUserDataFromServer(sessionToken);

    if (sessionUser.surveyAnswers) {
      setActiveTab("home");
    } else {
      setActiveTab("quiz");
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (e) {}
    }

    setUser(null);
    setToken(null);
    setWatchlist([]);
    setWatchHistory([]);
    setRecommendations([]);
    localStorage.removeItem("cinematch_jwt_token");
    setActiveTab("auth");
  };

  const handleSaveSurvey = async (answers: SurveyAnswers) => {
    if (!user || !token) return;

    try {
      const response = await fetch("/api/user/survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers }),
      });

      if (response.ok) {
        // Update local memory user object representation
        const updatedUser = { ...user, surveyAnswers: answers };
        setUser(updatedUser);
        
        // Wipe local client recs to force asynchronous recalculation on home feed
        setRecommendations([]);
        setActiveTab("home");
      } else {
        alert("Failed to securely save preference profile on local cluster.");
      }
    } catch (err) {
      console.error("Failed to record survey choices:", err);
    }
  };

  const handleToggleWatchlist = (movie: Movie) => {
    if (!user) return;
    let nextWatchlist = [...watchlist];
    const index = watchlist.findIndex((m) => m.id === movie.id);

    if (index >= 0) {
      nextWatchlist.splice(index, 1);
    } else {
      nextWatchlist.push(movie);
    }

    setWatchlist(nextWatchlist);
    syncUserDataToServer(token, nextWatchlist, watchHistory);
  };

  const handleToggleWatched = (movie: Movie, rating?: number) => {
    if (!user) return;
    let nextHistory = [...watchHistory];
    const index = watchHistory.findIndex((h) => h.movie.id === movie.id);

    if (index >= 0) {
      nextHistory.splice(index, 1);
    } else {
      nextHistory.push({ movie, userRating: rating });
    }

    // Removing item from watchlist on checking watch status
    const nextWatchlist = watchlist.filter((m) => m.id !== movie.id);

    setWatchHistory(nextHistory);
    setWatchlist(nextWatchlist);
    syncUserDataToServer(token, nextWatchlist, nextHistory);
  };

  const handleRateMovie = (movie: Movie, score: number) => {
    if (!user) return;
    let nextHistory = [...watchHistory];
    const index = watchHistory.findIndex((h) => h.movie.id === movie.id);

    if (index >= 0) {
      nextHistory[index].userRating = score;
    } else {
      nextHistory.push({ movie, userRating: score });
    }

    // Auto clear watchlist on rate trigger
    const nextWatchlist = watchlist.filter((m) => m.id !== movie.id);

    setWatchHistory(nextHistory);
    setWatchlist(nextWatchlist);
    syncUserDataToServer(token, nextWatchlist, nextHistory);
  };

  const handleUpdateRating = (movieId: string, rating: number) => {
    if (!user) return;
    const nextHistory = watchHistory.map((item) => {
      if (item.movie.id === movieId) {
        return { ...item, userRating: rating };
      }
      return item;
    });

    setWatchHistory(nextHistory);
    syncUserDataToServer(token, watchlist, nextHistory);
  };

  const handleRemoveHistory = (movieId: string) => {
    if (!user) return;
    const nextHistory = watchHistory.filter((item) => item.movie.id !== movieId);
    
    setWatchHistory(nextHistory);
    syncUserDataToServer(token, watchlist, nextHistory);
  };

  const handleClearProfile = async () => {
    if (!user || !token) return;

    if (!confirm("Are you sure you want to permanently delete your film profile? This action is irreversible.")) {
      return;
    }

    try {
      const response = await fetch("/api/user/clear", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        handleLogout();
      }
    } catch (err) {
      console.error("Account clear procedure failed:", err);
    }
  };

  const handleRetakeQuiz = () => {
    setActiveTab("quiz");
  };

  if (!sessionRestored) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-indigo-900 dark:text-indigo-400 font-sans">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-505" />
        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 animate-pulse">
          Connecting secure JWT authentication nodes...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 selection:bg-indigo-100 selection:text-indigo-800 font-sans antialiased">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={handleLogout} 
      />

      <main className="flex-grow">
        {!user ? (
          <Auth onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            {activeTab === "auth" && <Auth onLoginSuccess={handleLoginSuccess} />}
            {activeTab === "quiz" && (
              <OnboardingSurvey 
                initialAnswers={user.surveyAnswers} 
                onSave={handleSaveSurvey} 
              />
            )}
            {activeTab === "home" && (
              <Home
                user={user}
                authToken={token}
                watchlist={watchlist}
                watchHistory={watchHistory}
                recommendations={recommendations}
                setRecommendations={setRecommendations}
                onToggleWatchlist={handleToggleWatchlist}
                onToggleWatched={handleToggleWatched}
                onRateMovie={handleRateMovie}
              />
            )}
            {activeTab === "watchlist" && (
              <Watchlist
                watchlist={watchlist}
                watchHistory={watchHistory}
                onToggleWatchlist={handleToggleWatchlist}
                onToggleWatched={handleToggleWatched}
                onRateMovie={handleRateMovie}
              />
            )}
            {activeTab === "profile" && (
              <Profile
                user={user}
                watchlist={watchlist}
                watchHistory={watchHistory}
                onClearProfile={handleClearProfile}
                onRetakeQuiz={handleRetakeQuiz}
                onUpdateRating={handleUpdateRating}
                onRemoveHistory={handleRemoveHistory}
              />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white/70 backdrop-blur-md py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} CineMatch Applet. All rights reserved.</p>
          <p className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2">
            <span className="font-semibold text-slate-705">Full-Stack JWT Auth</span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-705">Redis Session Cache</span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-705">SHA-256 Passwords</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
