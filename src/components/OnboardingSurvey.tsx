/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ChevronRight, ChevronLeft, Sparkles, Check, Film, 
  HelpCircle, Languages, LayoutGrid, Award, Sliders, CalendarDays
} from "lucide-react";
import { SurveyAnswers, Movie } from "../types";
import { GENRE_OPTIONS, LANGUAGE_OPTIONS, THEME_OPTIONS, CURATED_MOVIES } from "../data/movies";

interface OnboardingSurveyProps {
  initialAnswers?: SurveyAnswers;
  onSave: (answers: SurveyAnswers) => void;
}

export default function OnboardingSurvey({ initialAnswers, onSave }: OnboardingSurveyProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [genres, setGenres] = useState<string[]>(initialAnswers?.favoriteGenres || []);
  const [favoriteMovies, setFavoriteMovies] = useState<string[]>(initialAnswers?.favoriteMovies || []);
  const [languages, setLanguages] = useState<string[]>(initialAnswers?.preferredLanguages || ["English"]);
  const [era, setEra] = useState<string>(initialAnswers?.eraPreference || "contemporary");
  const [pacing, setPacing] = useState<string>(initialAnswers?.pacePreference || "balanced");
  const [themes, setThemes] = useState<string[]>(initialAnswers?.themes || []);

  const [movieInput, setMovieInput] = useState("");
  const [movieSuggestions, setMovieSuggestions] = useState<Movie[]>([]);

  // Filter seed suggestion movies as user types
  const handleMovieInputChange = (val: string) => {
    setMovieInput(val);
    if (!val.trim()) {
      setMovieSuggestions([]);
      return;
    }
    const filtered = CURATED_MOVIES.filter(m => 
      m.title.toLowerCase().includes(val.toLowerCase()) && 
      !favoriteMovies.includes(m.title)
    );
    setMovieSuggestions(filtered.slice(0, 4));
  };

  const handleAddMovie = (titleToAdd: string) => {
    const trimmed = titleToAdd.trim();
    if (trimmed && !favoriteMovies.includes(trimmed)) {
      setFavoriteMovies([...favoriteMovies, trimmed]);
    }
    setMovieInput("");
    setMovieSuggestions([]);
  };

  const handleRemoveMovie = (titleToRemove: string) => {
    setFavoriteMovies(favoriteMovies.filter(t => t !== titleToRemove));
  };

  const toggleGenre = (genre: string) => {
    if (genres.includes(genre)) {
      setGenres(genres.filter(g => g !== genre));
    } else {
      setGenres([...genres, genre]);
    }
  };

  const toggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      setLanguages(languages.filter(l => l !== lang));
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const toggleTheme = (theme: string) => {
    if (themes.includes(theme)) {
      setThemes(themes.filter(t => t !== theme));
    } else {
      setThemes([...themes, theme]);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Done - save and trigger recommendation build
      const finalAnswers: SurveyAnswers = {
        favoriteGenres: genres,
        favoriteMovies,
        preferredLanguages: languages,
        eraPreference: era,
        pacePreference: pacing,
        themes
      };
      
      onSave(finalAnswers);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Helper validation to prevent navigating empty surveys
  const isStepValid = () => {
    if (step === 1) return genres.length > 0;
    if (step === 2) return favoriteMovies.length > 0;
    if (step === 3) return languages.length > 0;
    return true;
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:py-12 animate-fadeIn font-sans" id="onboarding-survey-container">
      {/* Title */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center space-x-1.5 rounded-full bg-indigo-500/10 px-3.5 py-1 text-xs font-bold text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 mb-3 animate-scaleUp uppercase tracking-widest font-mono">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>Cinematic Taste Engine</span>
        </span>
        <h1 className="text-3xl font-black tracking-tight text-slate-850 dark:text-white sm:text-4xl font-display">
          What kind of movies do you love?
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Answer a few quick questions to feed the CineMatch machine learning models.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8" id="survey-progressbar-wrapper">
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-bold mb-2.5 uppercase tracking-wider font-mono">
          <span>Step {step} of {totalSteps}: {
            step === 1 ? "Favorite Genres" : 
            step === 2 ? "Films You Enjoyed" : 
            step === 3 ? "Languages" : "Cinematic Attributes"
          }</span>
          <span>{Math.round((step / totalSteps) * 100)}% Complete</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-650 transition-all duration-300 rounded-full"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Slide Canvas Cards */}
      <div className="mb-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 sm:p-8 shadow-xl dark:shadow-none backdrop-blur-md" id="survey-step-card">
        
        {/* Step 1: Genres */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn" id="survey-genres-view">
            <div className="flex items-start space-x-3">
              <LayoutGrid className="h-6 w-6 text-indigo-550 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-white font-display">Select Your Favorite Genres</h3>
                <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">Please choose at least 1 genre that interests you.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 pt-4">
              {GENRE_OPTIONS.map((genre) => {
                const isSelected = genres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`flex items-center justify-between rounded-xl border p-3.5 text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-650 dark:text-indigo-300"
                        : "border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-slate-550 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    <span>{genre}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-indigo-550 dark:text-indigo-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Seed Favourite Movies */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn" id="survey-seed-view">
            <div className="flex items-start space-x-3">
              <Film className="h-6 w-6 text-indigo-550 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-white font-display">List Movies You Loved</h3>
                <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">Add at least one film you enjoyed previously as a reference seed.</p>
              </div>
            </div>

            <div className="space-y-3 pt-3">
              {/* Added Movies Tags */}
              {favoriteMovies.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-2">
                  {favoriteMovies.map((title) => (
                    <span 
                      key={title}
                      className="inline-flex items-center space-x-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-white"
                    >
                      <span className="font-semibold">{title}</span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveMovie(title)}
                        className="text-slate-400 hover:text-rose-550 dark:hover:text-rose-450 text-sm font-bold cursor-pointer"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Input for new movie Title */}
              <div className="relative">
                <input
                  type="text"
                  value={movieInput}
                  onChange={(e) => handleMovieInputChange(e.target.value)}
                  placeholder="Type a movie title (e.g. Shutter Island)..."
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 px-4 py-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-400 focus:outline-none transition-all font-sans"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddMovie(movieInput);
                    }
                  }}
                />
                
                {movieInput.trim() && (
                  <button
                    type="button"
                    onClick={() => handleAddMovie(movieInput)}
                    className="absolute right-2.5 top-2.5 rounded-lg bg-indigo-500 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-400 cursor-pointer"
                  >
                    Add
                  </button>
                )}

                {/* Autocomplete suggestions */}
                {movieSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 z-10 mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-2xl">
                    {movieSuggestions.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleAddMovie(m.title)}
                        className="flex cursor-pointer items-center justify-between px-4 py-2.5 hover:bg-indigo-500/10 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-semibold text-slate-800 dark:text-white">{m.title}</span>
                          <span className="text-[10px] text-slate-450 mt-0.5">{m.genres.join(", ")} • {m.year}</span>
                        </div>
                        <span className="text-xs font-extrabold text-indigo-550 dark:text-indigo-400">+ Add</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Prompt Suggestions */}
              <div className="rounded-2xl border border-dashed border-slate-150 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center mb-2 font-mono">
                  <Award className="h-3.5 w-3.5 shrink-0 text-indigo-500 dark:text-indigo-400 mr-1" />
                  Quick Seed Recommendations
                </span>
                <p className="text-[11px] text-slate-400 dark:text-slate-550 mb-3.5">Click any standard masterpieces below to instantly add them to your taste seeds:</p>
                <div className="flex flex-wrap gap-1.5">
                  {CURATED_MOVIES.slice(0, 7).map(m => {
                    const isAdded = favoriteMovies.includes(m.title);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        disabled={isAdded}
                        onClick={() => handleAddMovie(m.title)}
                        className={`text-xs rounded-lg px-2.5 py-1.5 border transition-all cursor-pointer ${
                          isAdded 
                            ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-350 border-indigo-500/20"
                            : "bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-slate-150 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-800 dark:hover:text-white"
                        }`}
                      >
                        {m.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Languages */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn" id="survey-languages-view">
            <div className="flex items-start space-x-3">
              <Languages className="h-6 w-6 text-indigo-550 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-white font-display">Preferred Movie Languages</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans">Which original vocal tracks and foreign subtitles do you prefer browsing?</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-3">
              {LANGUAGE_OPTIONS.map((lang) => {
                const isSelected = languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`flex items-center justify-between rounded-xl border p-3.5 text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-650 dark:text-indigo-300"
                        : "border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-slate-550 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    <span>{lang}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-indigo-550 dark:text-indigo-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Cinematic Attributes */}
        {step === 4 && (
          <div className="space-y-6 animate-fadeIn" id="survey-attributes-view">
            <div className="flex items-start space-x-3 mb-2">
              <Sliders className="h-6 w-6 text-indigo-550 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-white font-display">Cinematics & Vibes</h3>
                <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5 font-sans">Fine-tune the mood settings for the recommendation models.</p>
              </div>
            </div>

            {/* Era and Pacing selector */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5" id="era-control">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center font-mono">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-500 mr-1 shrink-0" />
                  Release Era Preference
                </label>
                <select
                  value={era}
                  onChange={(e) => setEra(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="classic">Retro & Classics (pre-1990s)</option>
                  <option value="modern">Modern Masterpieces (1990 - 2009)</option>
                  <option value="contemporary">Contemporary & Recent (2010 - present)</option>
                  <option value="no-preference">No Preference (Across eras)</option>
                </select>
              </div>

              <div className="space-y-1.5" id="pace-control">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center font-mono">
                  <Sliders className="h-3.5 w-3.5 text-slate-500 mr-1 shrink-0" />
                  pacing speed
                </label>
                <select
                  value={pacing}
                  onChange={(e) => setPacing(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="slow-burn">Slow-Burn / Intimate</option>
                  <option value="balanced">Balanced Narrative</option>
                  <option value="fast-paced">Fast-Paced / High-Octane</option>
                </select>
              </div>
            </div>

            {/* Themes Tag Multi-Select */}
            <div className="space-y-2 pt-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono">
                Visual & Narrative Vibe
              </label>
              <div className="flex flex-wrap gap-2 pt-1.5">
                {THEME_OPTIONS.map((theme) => {
                  const isSelected = themes.includes(theme);
                  return (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => toggleTheme(theme)}
                      className={`rounded-xl px-3.5 py-2.5 text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-650 dark:text-indigo-300"
                          : "border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-slate-550 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-650 hover:text-slate-800 dark:hover:text-white"
                      }`}
                    >
                      {theme}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Control Buttons */}
      <div className="flex justify-between items-center" id="survey-controls-bar">
        <button
          id="survey-prev-btn"
          type="button"
          onClick={handleBack}
          disabled={step === 1}
          className={`flex items-center space-x-1.5 rounded-xl border px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
            step === 1 
              ? "opacity-30 border-slate-200 dark:border-slate-800 text-slate-350 dark:text-slate-600 cursor-not-allowed" 
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-805 dark:hover:text-white cursor-pointer active:scale-[0.98]"
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <button
          id="survey-next-btn"
          type="button"
          onClick={handleNext}
          disabled={!isStepValid()}
          className={`flex items-center space-x-1.5 rounded-xl px-6 py-3 text-xs font-extrabold uppercase tracking-widest transition-all ${
            isStepValid()
              ? "bg-indigo-500 text-white hover:bg-indigo-600 cursor-pointer active:scale-[0.98] shadow-md shadow-indigo-500/10"
              : "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
          }`}
        >
          <span>{step === totalSteps ? "Generate suggestions" : "Next Step"}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
