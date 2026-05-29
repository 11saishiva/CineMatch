/**
 * Movie Display Card Component
 * Redesigned in light-pastel style frames.
 * Integrates stopPropagation triggers to prevent overlapping popup selectors.
 */

import React, { useState } from "react";
import { 
  Star, Bookmark, BookmarkCheck, CheckCircle2, 
  Clock, Check
} from "lucide-react";
import { Movie } from "../types";

interface MovieCardProps {
  key?: any;
  movie: Movie;
  confidenceScore?: number;
  reason?: string;
  matchingFactor?: string;
  isInWatchlist: boolean;
  isWatched: boolean;
  userRating?: number;
  onToggleWatchlist: () => void;
  onToggleWatched: (rating?: number) => void;
  onRateMovie: (score: number) => void;
}

export default function MovieCard({
  movie,
  confidenceScore,
  reason,
  matchingFactor,
  isInWatchlist,
  isWatched,
  userRating = 0,
  onToggleWatchlist,
  onToggleWatched,
  onRateMovie,
}: MovieCardProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [showRatingMenu, setShowRatingMenu] = useState(false);
  const [showOverview, setShowOverview] = useState(false);

  const starValue = userRating;

  const handleStarSelection = (score: number) => {
    onRateMovie(score);
    setShowRatingMenu(false);
  };

  return (
    <div 
      className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-indigo-50 bg-white transition-all duration-300 hover:scale-[1.01] hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-100"
      id={`movie-card-${movie.id}`}
    >
      {/* Visual Header Poster image */}
      <div className="relative h-56 w-full overflow-hidden" id="card-media-wrapper">
        <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-slate-900/10 to-transparent z-10" />
        <img
          src={movie.posterUrl}
          alt={movie.title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-104"
        />

        {/* Quick action bookmarks floating over the poster */}
        <div className="absolute right-4 top-4 z-20 flex space-x-1.5" id="card-floating-actions">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Avoid triggering full-details modal
              onToggleWatchlist();
            }}
            className={`flex h-8.5 w-8.5 items-center justify-center rounded-xl backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
              isInWatchlist 
                ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow" 
                : "bg-white/80 text-slate-650 border border-slate-105 hover:bg-white"
            }`}
            title={isInWatchlist ? "Remove from Watchlist" : "Bookmark to Watchlist"}
          >
            {isInWatchlist ? (
              <BookmarkCheck className="h-4.5 w-4.5" />
            ) : (
              <Bookmark className="h-4.5 w-4.5" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation(); // Avoid triggering full-details modal
              if (isWatched) {
                onToggleWatched(undefined); 
              } else {
                setShowRatingMenu(!showRatingMenu);
              }
            }}
            className={`flex h-8.5 w-8.5 items-center justify-center rounded-xl backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
              isWatched 
                ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow" 
                : "bg-white/80 text-slate-650 border border-slate-105 hover:bg-white"
            }`}
            title={isWatched ? "Mark Unwatched" : "Completed Watch (Rate movie)"}
          >
            <CheckCircle2 className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Confidence Percentage Match Tag for recommendations */}
        {confidenceScore !== undefined && (
          <div className="absolute left-4 top-4 z-20 animate-scaleUp" id="card-match-indicator">
            <span className="px-3 py-1 bg-indigo-500 text-[10px] font-black rounded-full uppercase tracking-wider text-white shadow-sm">
              Match {confidenceScore}%
            </span>
          </div>
        )}

        {/* Rating Floating Overlaid Menu */}
        {showRatingMenu && (
          <div 
            onClick={(e) => e.stopPropagation()} // Guard click bubbles
            className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center justify-center bg-white p-4.5 text-center border-t border-indigo-50 animate-fadeIn"
          >
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-450 mb-1.5">Rate recommendation:</span>
            <div className="flex space-x-1.5 mb-2.5">
              {[1, 2, 3, 4, 5].map((stars) => (
                <button
                  key={stars}
                  onClick={() => handleStarSelection(stars)}
                  onMouseEnter={() => setHoveredStar(stars)}
                  onMouseLeave={() => setHoveredStar(null)}
                  className="p-0.5 transition-all hover:scale-110 cursor-pointer text-slate-205"
                >
                  <Star 
                    className={`h-4.5 w-4.5 ${
                      stars <= (hoveredStar ?? starValue)
                        ? "fill-indigo-400 text-indigo-400"
                        : "text-slate-150"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex space-x-1.5 font-mono">
              <button
                onClick={() => {
                  onToggleWatched(0); 
                  setShowRatingMenu(false);
                }}
                className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:bg-slate-100 cursor-pointer"
              >
                Skip
              </button>
              <button
                onClick={() => setShowRatingMenu(false)}
                className="rounded-lg bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 cursor-pointer border border-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Poster over tags */}
        <div className="absolute left-3.5 bottom-3.5 z-20 flex flex-wrap gap-1.5" id="card-genres-wrapper">
          {movie.genres.slice(0, 2).map((gen) => (
            <span key={gen} className="rounded-lg bg-white/90 border border-slate-100 px-2 py-0.5 text-[9px] font-black text-slate-600 backdrop-blur-md uppercase tracking-wider">
              {gen}
            </span>
          ))}
        </div>
      </div>

      {/* Main card body metadata */}
      <div className="flex flex-1 flex-col p-5" id="card-inner-metadata">
        
        {/* Title row */}
        <div className="flex items-start justify-between min-h-[46px] mb-2">
          <div className="max-w-[75%]">
            <h3 className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
              {movie.title}
            </h3>
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-0.5 font-mono">
              <span>{movie.year}</span>
              <span>•</span>
              <span className="flex items-center text-[11px]">
                <Clock className="h-3 w-3 mr-0.5 text-slate-350" />
                {movie.duration || "120 min"}
              </span>
            </div>
          </div>
          
          {/* Rating badge */}
          <div className="flex items-center space-x-1 rounded-lg bg-slate-50 px-2 py-0.5 border border-slate-100 max-w-[25%] font-mono leading-none">
            <Star className="h-3 w-3 fill-indigo-400 text-indigo-400" />
            <span className="text-[11px] font-black text-slate-600">{movie.rating || "4.5"}</span>
          </div>
        </div>

        {/* User rating progress */}
        {isWatched && (
          <div className="mb-2 flex items-center space-x-1 text-[11px] text-emerald-600 font-bold uppercase tracking-wider" id="user-rating-given-tag font-mono">
            <Check className="h-3.5 w-3.5" />
            <span>Completed</span>
            {userRating > 0 && (
              <>
                <span className="text-slate-205 font-light">|</span>
                <span className="flex items-center">
                  Rated {userRating} <Star className="h-2.5 w-2.5 fill-indigo-400 text-indigo-400 ml-0.5" />
                </span>
              </>
            )}
          </div>
        )}

        {/* Synopsis text */}
        <p className="text-xs text-slate-505 leading-relaxed line-clamp-2">
          {movie.overview}
        </p>

        {/* Matching details provided by model (if recommendation card) */}
        {matchingFactor && (
          <div className="mt-auto pt-3.5 border-t border-slate-50" id="card-matching-indicator">
            <span className="text-[9px] font-bold text-indigo-500 tracking-widest uppercase block mb-0.5 font-mono">
              {matchingFactor}
            </span>
            {reason && (
              <p className="text-[11px] text-slate-450 line-clamp-2 leading-relaxed">
                {reason}
              </p>
            )}
          </div>
        )}

        {/* Card footer details */}
        {!matchingFactor && (
          <div className="mt-auto pt-3.5 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 font-mono" id="card-cast-footer">
            <span className="truncate max-w-[65%]">Dir: {movie.director || "N/A"}</span>
            <button 
              id="view-overview-toggle"
              onClick={(e) => {
                e.stopPropagation(); // Avoid triggering full-details modal
                setShowOverview(!showOverview);
              }}
              className="text-indigo-455 hover:text-indigo-600 transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider block shrink-0"
            >
              Info
            </button>
          </div>
        )}

        {showOverview && (
          <div 
            onClick={(e) => e.stopPropagation()} // Stop modal triggers
            className="absolute inset-0 z-25 bg-white p-5 flex flex-col justify-between animate-fadeIn" 
            id="overview-overlays"
          >
            <div className="space-y-3 text-left">
              <h4 className="text-sm font-black text-slate-800 mb-1.5">{movie.title} ({movie.year})</h4>
              <div className="text-xs space-y-1 text-slate-450 font-mono">
                <p><span className="text-slate-400">Director:</span> {movie.director || "N/A"}</p>
                <p><span className="text-slate-400">Casting:</span> {movie.cast?.slice(0, 3).join(", ") || "N/A"}</p>
                <p><span className="text-slate-400">Duration:</span> {movie.duration || "N/A"}</p>
              </div>
              <p className="text-xs text-slate-550 leading-relaxed pt-1.5 max-h-[140px] overflow-y-auto">{movie.overview}</p>
            </div>
            
            <button
              onClick={() => setShowOverview(false)}
              className="w-full rounded-xl bg-slate-50 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 border border-slate-100 text-center cursor-pointer"
            >
              Close Panel
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
