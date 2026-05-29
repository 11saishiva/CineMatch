/**
 * CineMatch AI Home / Discover Dashboard
 * Redesigned in light-pastel bento grids.
 * Integrates real-time TVMaze / Gemini IMDb Search Details popups and
 * an Asynchronous recommendation worker polling bar.
 */

import React, { useState, useEffect } from "react";
import { 
  Sparkles, Search, RotateCcw, Compass, Film, 
  HelpCircle, AlertCircle, PlayCircle, Star, Tv, BadgeHelp,
  Activity, ArrowUpRight, Clock, Award, Globe, DollarSign, X
} from "lucide-react";
import { Movie, UserSession } from "../types";
import MovieCard from "./MovieCard";
import { CURATED_MOVIES } from "../data/movies";

interface HomeProps {
  user: UserSession;
  authToken: string | null;
  watchlist: Movie[];
  watchHistory: { movie: Movie; userRating?: number }[];
  recommendations: any[];
  setRecommendations: (recs: any[]) => void;
  onToggleWatchlist: (movie: Movie) => void;
  onToggleWatched: (movie: Movie, rating?: number) => void;
  onRateMovie: (movie: Movie, score: number) => void;
}

export default function Home({
  user,
  authToken,
  watchlist,
  watchHistory,
  recommendations,
  setRecommendations,
  onToggleWatchlist,
  onToggleWatched,
  onRateMovie,
}: HomeProps) {
  const [moodInput, setMoodInput] = useState("");
  const [activeMoodQuery, setActiveMoodQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Asynchronous recommendation job states
  const [jobProgress, setJobProgress] = useState(0);
  const [jobMessage, setJobMessage] = useState("");
  const [jobActiveId, setJobActiveId] = useState<string | null>(null);

  // Curated explore tabs
  const [exploreGenre, setExploreGenre] = useState<string>("All");

  // Detailed Movie metadata popup (IMDb Search grounding)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailMovieTitle, setDetailMovieTitle] = useState("");
  const [selectedMovieDetails, setSelectedMovieDetails] = useState<any | null>(null);

  // Trigger recommendation build automatically on load if we don't have recommendations yet
  useEffect(() => {
    if (user.surveyAnswers && recommendations.length === 0 && !loading) {
      triggerAsyncRecommendationBuild(false);
    }
  }, [user]);

  // Polling hook for asynchronous job manager
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    if (jobActiveId && loading) {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/recommendations/jobs/${jobActiveId}`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });

          if (!res.ok) {
            throw new Error("Could not check async queue status.");
          }

          const job = await res.json();
          setJobProgress(job.progressPercent || 0);
          setJobMessage(job.currentStepMessage || "Processing...");

          if (job.status === "completed") {
            setRecommendations(job.result || []);
            setLoading(false);
            setJobActiveId(null);
            if (moodInput.trim()) {
              setActiveMoodQuery(moodInput);
            } else {
              setActiveMoodQuery("");
            }
          } else if (job.status === "failed") {
            throw new Error(job.error || "Async recommendation mapper failed.");
          }
        } catch (err: any) {
          console.error("Polling error:", err);
          setError(err.message || "Failed to cross-examine async job status.");
          setLoading(false);
          setJobActiveId(null);
        }
      }, 1500);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [jobActiveId, loading]);

  const triggerAsyncRecommendationBuild = async (useMood: boolean = false) => {
    setLoading(true);
    setError("");
    setJobProgress(5);
    setJobMessage("Enqueuing ML mapping job in async database pipeline...");

    try {
      const response = await fetch("/api/recommendations/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          surveyAnswers: user.surveyAnswers,
          watchHistory,
          watchlist,
          customMoodQuery: useMood ? moodInput : undefined
        })
      });

      if (!response.ok) {
        throw new Error("Could not queue matching job in server cluster. Check Gemini configuration.");
      }

      const data = await response.json();
      if (data && data.jobId) {
        setJobActiveId(data.jobId);
      } else {
        throw new Error("Job queue manager did not allocate a valid Job ID.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Endpoint connection failure on recommendation build trigger.");
      setLoading(false);
    }
  };

  const handleMoodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moodInput.trim()) return;
    triggerAsyncRecommendationBuild(true);
  };

  const handleResetRecommendations = () => {
    setMoodInput("");
    triggerAsyncRecommendationBuild(false);
  };

  // Fetch up-to-date IMDb statistics / live details
  const handleOpenMovieDetails = async (movieTitle: string) => {
    setDetailMovieTitle(movieTitle);
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setSelectedMovieDetails(null);

    try {
      const res = await fetch(`/api/movie-details?title=${encodeURIComponent(movieTitle)}`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      if (!res.ok) {
        throw new Error("IMDb proxy returned a non-ok endpoint status.");
      }
      const data = await res.json();
      if (data && data.details) {
        setSelectedMovieDetails(data.details);
      } else {
        throw new Error("Malformed movie metadata structure received from cluster.");
      }
    } catch (err: any) {
      setDetailError(err.message || "Failed to load movie meta analysis statistics.");
    } finally {
      setDetailLoading(false);
    }
  };

  // Filter local explore list based on selected tab genre
  const exploreFilterList = exploreGenre === "All"
    ? CURATED_MOVIES
    : CURATED_MOVIES.filter(m => m.genres.includes(exploreGenre));

  // Quick lists
  const watchlistIds = watchlist.map(m => m.id);
  const watchedIds = watchHistory.map(m => m.movie.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12 animate-fadeIn font-sans bg-[#f8fafc]/5" id="home-view-container">
      
      {/* Search-by-mood Showcase Section - Designed as a beautiful soft-pastel bento box */}
      <div className="relative mb-12 overflow-hidden rounded-[2.5rem] border border-indigo-100 bg-linear-to-tr from-indigo-50/60 via-purple-50/20 to-sky-50/70 p-8 sm:p-10 shadow-lg shadow-slate-100 flex flex-col md:flex-row items-center justify-between gap-8" id="mood-search-container">
        
        <div className="space-y-4 max-w-xl text-center md:text-left z-10">
          <span className="inline-flex items-center space-x-1.5 rounded-full bg-indigo-100/80 px-3.5 py-1 text-xs font-bold text-indigo-750 border border-indigo-200/50 mb-1 uppercase tracking-wider font-mono">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
            <span>AI Movie Oracle</span>
          </span>
          <h2 className="text-3xl font-extrabold text-slate-850 tracking-tight leading-tight">
            How is your movie mood today?
          </h2>
          <p className="text-sm text-slate-550 leading-relaxed">
            Specify customized preferences using your own words! Ask Gemini to retrieve matching gems for any mood prompt, filtered dynamically with your survey preference and rating records.
          </p>

          <form onSubmit={handleMoodSubmit} className="relative flex rounded-2xl shadow-md w-full pt-1.5" id="mood-search-form">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-indigo-400 mt-1.5">
              <Search className="h-4.5 w-4.5" />
            </div>
            <input
              type="text"
              required
              value={moodInput}
              onChange={(e) => setMoodInput(e.target.value)}
              placeholder="e.g. A dystopian cyberpunk thriller with neon visuals..."
              className="block w-full rounded-l-2xl border border-indigo-100 bg-white py-3.5 pl-11 pr-3 text-sm text-slate-850 placeholder-slate-400 focus:border-indigo-400 focus:outline-none transition-all"
            />
            <button
              id="mood-search-submit"
              type="submit"
              disabled={loading}
              className="inline-flex cursor-pointer items-center space-x-1.5 rounded-r-2xl bg-indigo-500 px-6 text-xs font-bold uppercase tracking-wider text-white hover:bg-indigo-650 transition-colors disabled:opacity-50"
            >
              <span>Search</span>
            </button>
          </form>
          <div className="flex flex-wrap gap-1.5 justify-center md:justify-start pt-1 text-[11px] text-slate-400 font-mono">
            <span>Try these moods:</span>
            {["Feel-good indie", "Mind-bending time travel", "Intense crime thriller"].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setMoodInput(term);
                }}
                className="text-indigo-600 hover:text-indigo-800 transition-colors underline underline-offset-2 font-semibold"
              >
                "{term}"
              </button>
            ))}
          </div>
        </div>

        {/* Cinematic Illustration box */}
        <div className="relative shrink-0 w-full sm:w-72 h-44 rounded-3xl overflow-hidden border border-white bg-indigo-50 group opacity-90 shadow-md" id="oracle-illustration">
          <div className="absolute inset-0 bg-linear-to-t from-indigo-900/40 via-transparent to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop" 
            alt="Cinematic mood projector background" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
          />
          <div className="absolute bottom-4 left-4 z-20 flex items-center space-x-2 bg-white/80 backdrop-blur-md py-1.5 px-3 rounded-full border border-white">
            <PlayCircle className="h-5 w-5 text-indigo-500" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black text-slate-755 font-mono uppercase tracking-wider">CineMatch ML Node</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Dashboard Section */}
      <section className="mb-14 scroll-mt-20" id="ai-recommender-hub-section">
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-indigo-50 pb-4 mb-6 gap-4">
          <div className="flex items-center space-x-2.5 text-center sm:text-left">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Tv className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center">
                <span>Recommendations Feed</span>
                {activeMoodQuery && (
                  <span className="ml-2.5 bg-indigo-100 text-indigo-755 border border-indigo-200/50 rounded-full px-2.5 py-0.5 text-[9px] font-bold">
                    MOOD: "{activeMoodQuery}"
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-450 mt-0.5">Custom cinematic matches mapped to your current questionnaire preferences.</p>
            </div>
          </div>

          <div className="flex space-x-2" id="recommender-actions">
            {activeMoodQuery && (
              <button
                id="reset-mood-recs-btn"
                onClick={handleResetRecommendations}
                className="flex items-center space-x-1.5 rounded-xl border border-slate-100 bg-white text-slate-500 font-bold text-xs uppercase tracking-wider px-3.5 py-2.5 hover:text-slate-800 transition-colors shadow-sm cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Mood Filter</span>
              </button>
            )}

            <button
              id="reload-ai-recs-btn"
              onClick={() => triggerAsyncRecommendationBuild(!!activeMoodQuery)}
              disabled={loading}
              className="flex items-center space-x-1.5 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-indigo-100 hover:bg-indigo-605 transition-colors cursor-pointer disabled:opacity-40"
            >
              <span>Refresh Suggestions</span>
            </button>
          </div>
        </div>

        {/* ASYNCHRONOUS Recommendation load states */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center border border-indigo-100 rounded-[2.5rem] bg-white shadow-md animate-fadeIn" id="recs-loading-overlay">
            <div className="relative mb-5" id="cinematic-loader">
              <div className="h-14 w-14 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="h-5 w-5 text-indigo-400 animate-pulse" />
              </div>
            </div>

            {/* Micro progress indicator */}
            <div className="w-full max-w-sm bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-350"
                style={{ width: `${jobProgress}%` }}
              />
            </div>

            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-indigo-600 font-mono mb-1">
              <span>Job Pipeline Running ({jobProgress}%)</span>
            </div>
            
            <p className="text-sm font-semibold text-slate-800 italic max-w-md">
              "{jobMessage}"
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mt-2 leading-relaxed">
              This task runs asynchronously to ensure your browser thread remains responsive. Check status on database sync nodes.
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 text-center border border-rose-100 bg-rose-50/50 rounded-[2rem] max-w-2xl mx-auto" id="recs-error-card">
            <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3 shrink-0" />
            <h4 className="text-base font-bold text-rose-800">CineMatch Connection Interrupt</h4>
            <p className="text-xs text-rose-650 max-w-md mx-auto mt-2 leading-relaxed">
              {error}. Verify that your <strong className="text-slate-850">GEMINI_API_KEY</strong> secret configuration is correct in the secrets dashboard.
            </p>
            
            {/* Fallback info */}
            <div className="mt-5 border-t border-slate-100 pt-4 text-left max-w-md mx-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">Exploring offline items instead:</span>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                You can browse, query, and structure ratings models using our local preloaded cinema catalogs below!
              </p>
            </div>
          </div>
        )}

        {/* Recommendations list */}
        {!loading && !error && (
          <>
            {recommendations.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" id="ai-recs-grid">
                {recommendations.map((rec) => (
                  <div 
                    key={rec.movie.id} 
                    className="relative group cursor-pointer"
                    onClick={() => handleOpenMovieDetails(rec.movie.title)}
                  >
                    <MovieCard
                      movie={rec.movie}
                      confidenceScore={rec.confidenceScore}
                      reason={rec.reason}
                      matchingFactor={rec.matchingFactor}
                      isInWatchlist={watchlistIds.includes(rec.movie.id)}
                      isWatched={watchedIds.includes(rec.movie.id)}
                      userRating={watchHistory.find((h) => h.movie.id === rec.movie.id)?.userRating}
                      onToggleWatchlist={() => onToggleWatchlist(rec.movie)}
                      onToggleWatched={(ratingValue) => onToggleWatched(rec.movie, ratingValue)}
                      onRateMovie={(score) => onRateMovie(rec.movie, score)}
                    />
                    <div className="absolute top-4 right-14 bg-white/90 backdrop-blur-md rounded-full p-2 border border-indigo-100 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm" title="Show IMDb analysis details">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 rounded-[2rem] border border-indigo-100 bg-white" id="empty-recs-log">
                <BadgeHelp className="h-8 w-8 text-indigo-400 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800">Taste preferences loading...</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-2 leading-relaxed">
                  Complete your short onboarding taste survey so that our ML algorithm can compile custom recommendations.
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Curated Explore Section */}
      <section className="scroll-mt-20" id="browse-explore-section">
        <div className="border-b border-indigo-50 pb-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-800 flex items-center">
                <Compass className="h-5 w-5 text-indigo-500 mr-2 shrink-0" />
                <span>Explore CineMatch Masterpieces</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">Browse acclaimed world cinema to seed initial rating points.</p>
            </div>

            {/* Genre Category sliders filter */}
            <div className="flex overflow-x-auto gap-1.5 max-w-full pb-1 sm:pb-0 font-mono" id="explore-genre-filters">
              {["All", "Sci-Fi", "Drama", "Action", "Romance", "Animation", "Comedy"].map((gen) => (
                <button
                  key={gen}
                  onClick={() => setExploreGenre(gen)}
                  className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition-all border whitespace-nowrap cursor-pointer ${
                    exploreGenre === gen
                      ? "bg-indigo-500 text-white border-indigo-500 shadow-md"
                      : "bg-white border-indigo-50/50 text-slate-550 hover:text-indigo-500 hover:border-indigo-200 shadow-xs"
                  }`}
                >
                  {gen}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Explore Results Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" id="explore-grid">
          {exploreFilterList.map((movie) => (
            <div 
              key={movie.id}
              className="relative group cursor-pointer"
              onClick={() => handleOpenMovieDetails(movie.title)}
            >
              <MovieCard
                movie={movie}
                isInWatchlist={watchlistIds.includes(movie.id)}
                isWatched={watchedIds.includes(movie.id)}
                userRating={watchHistory.find((h) => h.movie.id === movie.id)?.userRating}
                onToggleWatchlist={() => onToggleWatchlist(movie)}
                onToggleWatched={(ratingValue) => onToggleWatched(movie, ratingValue)}
                onRateMovie={(score) => onRateMovie(movie, score)}
              />
              <div className="absolute top-4 right-14 bg-white/90 backdrop-blur-md rounded-full p-2 border border-indigo-100 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm" title="Show IMDb analysis details">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------
          REAL-TIME IMDB MOVIE-DETAILS SECTOR: POPUP DIALOG MODAL
         ------------------------------------------------------------- */}
      {isDetailModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn" 
          id="movie-detail-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDetailModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 p-4 sm:p-8 shadow-2xl max-h-[95vh] sm:max-h-[85vh] flex flex-col">
            
            {/* Close trigger */}
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute top-4 right-4 h-9 w-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 text-slate-500 hover:text-rose-505 dark:text-slate-300 dark:hover:text-rose-400 transition-colors z-20 cursor-pointer"
              title="Close Panel"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {detailLoading && (
              <div className="py-20 text-center space-y-3.5 flex flex-col items-center justify-center flex-grow">
                <div className="h-10 w-10 border-4 border-indigo-150 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-brand-indigo font-mono">
                  Accessing TMDB IMDb core registries...
                </p>
                <p className="text-[11px] text-slate-450">Retrieving ratings, casting rosters, runtime, and cinematic records.</p>
              </div>
            )}

            {detailError && (
              <div className="py-12 text-center max-w-md mx-auto space-y-3 flex flex-col items-center justify-center flex-grow">
                <AlertCircle className="h-10 w-10 text-rose-500" />
                <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200">Movie Information Unresolved</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{detailError}</p>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-200 text-xs font-bold rounded-xl text-slate-700 transition-colors cursor-pointer"
                >
                  Close Panel
                </button>
              </div>
            )}

            {!detailLoading && !detailError && selectedMovieDetails && (
              <div className="overflow-y-auto flex-grow pr-1.5 space-y-6 mt-4">
                
                {/* Header layout */}
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <div className="w-24 sm:w-28 h-36 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-md shrink-0">
                    <img 
                      src={selectedMovieDetails.posterUrl} 
                      alt={selectedMovieDetails.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="inline-flex items-center space-x-1 border border-indigo-200/50 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 px-3 py-0.5 rounded-full text-[10px] font-black font-mono">
                      <Star className="h-3 w-3 text-indigo-500 fill-indigo-500" />
                      <span>Score: {selectedMovieDetails.rating}</span>
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-850 dark:text-white tracking-tight leading-none">
                      {selectedMovieDetails.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>• {selectedMovieDetails.year}</span>
                      <span>• {selectedMovieDetails.runtime || selectedMovieDetails.duration || "N/A"}</span>
                      <span>• {selectedMovieDetails.language || "English"}</span>
                    </div>
                  </div>
                </div>

                {/* Genres / tags */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedMovieDetails.genres && selectedMovieDetails.genres.map((g: string) => (
                    <span key={g} className="bg-slate-100 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 font-mono">
                      {g}
                    </span>
                  ))}
                </div>

                {/* Synopsis */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400 font-mono block">
                    Official Catalog Synopsis
                  </span>
                  <p className="text-slate-650 dark:text-slate-300 text-sm leading-relaxed font-sans">
                    {selectedMovieDetails.overview}
                  </p>
                </div>

                {/* Additional Credits bento layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-5">
                  <div className="space-y-2 bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Clock className="h-4 w-4 text-emerald-500" />
                      <span>Production details</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                      <p><strong>Director:</strong> {selectedMovieDetails.director || "N/A"}</p>
                      <p className="line-clamp-2"><strong>Cast:</strong> {selectedMovieDetails.cast?.join(", ") || "N/A"}</p>
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Award className="h-4 w-4 text-indigo-500" />
                      <span>Cinematic Trivia Spotlight</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-450 line-clamp-3 leading-relaxed">
                      {selectedMovieDetails.trivia || "Acclaimed masterwork cataloged and retrieved dynamically using public movie directories."}
                    </p>
                  </div>
                </div>

                {/* Source Verification Header footer */}
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 font-mono pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center"><Globe className="h-3.5 w-3.5 mr-1 text-slate-300 dark:text-slate-650" /> Source: {selectedMovieDetails.source || "External API"}</span>
                  {selectedMovieDetails.boxOffice && <span className="flex items-center"><DollarSign className="h-3.5 w-3.5 mr-0.5 text-emerald-505" /> Box Office: {selectedMovieDetails.boxOffice}</span>}
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
