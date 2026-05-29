/**
 * My Bookmarks Library (Watchlist & History logs tracker)
 * Redesigned in light-pastel typography and soft colors.
 */

import React, { useState } from "react";
import { 
  Bookmark, FolderHeart, CheckCircle2 
} from "lucide-react";
import { Movie } from "../types";
import MovieCard from "./MovieCard";

interface WatchlistProps {
  watchlist: Movie[];
  watchHistory: { movie: Movie; userRating?: number }[];
  onToggleWatchlist: (movie: Movie) => void;
  onToggleWatched: (movie: Movie, rating?: number) => void;
  onRateMovie: (movie: Movie, score: number) => void;
}

export default function Watchlist({
  watchlist,
  watchHistory,
  onToggleWatchlist,
  onToggleWatched,
  onRateMovie,
}: WatchlistProps) {
  const [activeSubTab, setActiveSubTab] = useState<"watchlist" | "watched">("watchlist");

  const totalWatch = watchlist.length;
  const totalWatched = watchHistory.length;
  const totalCount = totalWatch + totalWatched;
  const completionRate = totalCount > 0 ? Math.round((totalWatched / totalCount) * 100) : 0;

  const watchlistIds = watchlist.map((m) => m.id);
  const watchedIds = watchHistory.map((m) => m.movie.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12 animate-fadeIn" id="watchlist-view-container">
      
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-indigo-55 pb-5 mb-8 gap-6 text-center sm:text-left" id="watchlist-stats">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center justify-center sm:justify-start">
            <FolderHeart className="h-6 w-6 text-indigo-500 mr-2 shrink-0 animate-scaleUp" />
            <span>My Bookmarks Collection</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Track films you budget to watch later or review items you have successfully completed.</p>
        </div>

        {/* Dynamic Watchlist completion rate tracker */}
        <div className="flex items-center space-x-3 bg-white px-4.5 py-2.5 rounded-2xl border border-indigo-50 shadow-xs">
          <div className="h-9 w-9 rounded-full bg-indigo-55 flex items-center justify-center">
            <CheckCircle2 className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none font-mono">Completion Grade</span>
            <span className="text-sm font-black text-slate-850 mt-1">{completionRate}% Finished</span>
            <span className="text-[9px] text-slate-400 mt-0.5">{totalWatched} of {totalCount} total logged</span>
          </div>
        </div>
      </div>

      {/* Tabs list toggle */}
      <div className="flex justify-center border-b border-indigo-50 pb-5 mb-8" id="watchlist-tabs-bar">
        <div className="inline-flex rounded-xl bg-slate-50 p-1 border border-slate-100" id="watchlist-toggles-wrapper">
          <button
            id="subtab-watchlist-btn"
            onClick={() => setActiveSubTab("watchlist")}
            className={`flex items-center space-x-2 rounded-lg px-4.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === "watchlist"
                ? "bg-indigo-500 text-white shadow-xs"
                : "text-slate-400 hover:text-indigo-500"
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>Plan to Watch ({totalWatch})</span>
          </button>

          <button
            id="subtab-history-btn"
            onClick={() => setActiveSubTab("watched")}
            className={`flex items-center space-x-2 rounded-lg px-4.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === "watched"
                ? "bg-indigo-500 text-white shadow-xs"
                : "text-slate-400 hover:text-indigo-500"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Completed Watches ({totalWatched})</span>
          </button>
        </div>
      </div>

      {/* Watchlist display cards list */}
      {activeSubTab === "watchlist" ? (
        <>
          {watchlist.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-fadeIn" id="watchlist-items-grid">
              {watchlist.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isInWatchlist={true}
                  isWatched={watchedIds.includes(movie.id)}
                  userRating={watchHistory.find((h) => h.movie.id === movie.id)?.userRating}
                  onToggleWatchlist={() => onToggleWatchlist(movie)}
                  onToggleWatched={(ratingValue) => onToggleWatched(movie, ratingValue)}
                  onRateMovie={(score) => onRateMovie(movie, score)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-3xl border border-dashed border-indigo-100 bg-white max-w-sm mx-auto shadow-xs" id="empty-watchlist-alert">
              <div className="h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
                <Bookmark className="h-4.5 w-4.5 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Your watchlist is currently empty</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1.5 leading-relaxed">
                Add films suggested by the Dynamic AI recommendations engine or explore cinematic catalog to build your plan.
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          {watchHistory.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-fadeIn" id="completed-items-grid">
              {watchHistory.map((item) => (
                <MovieCard
                  key={item.movie.id}
                  movie={item.movie}
                  isInWatchlist={watchlistIds.includes(item.movie.id)}
                  isWatched={true}
                  userRating={item.userRating}
                  onToggleWatchlist={() => onToggleWatchlist(item.movie)}
                  onToggleWatched={() => onToggleWatched(item.movie)}
                  onRateMovie={(score) => onRateMovie(item.movie, score)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-3xl border border-dashed border-indigo-100 bg-white max-w-sm mx-auto shadow-xs" id="empty-history-alert">
              <div className="h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-4.5 w-4.5 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No completed watching logs yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1.5 leading-relaxed">
                Check completed watches and provide star ratings on movie cards on discovery feed to construct profile models!
              </p>
            </div>
          )}
        </>
      )}

    </div>
  );
}
