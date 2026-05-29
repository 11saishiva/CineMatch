/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Movie {
  id: string;
  title: string;
  year: number;
  genres: string[];
  language: string;
  director?: string;
  cast?: string[];
  duration?: string; // e.g. "2h 1min"
  rating?: number; // average/estimated rating out of 5
  overview: string;
  posterUrl?: string;
  backdropUrl?: string;
}

export type CustomMoviePreference = {
  movieTitle: string;
  userRating?: number; // 1-5
  comment?: string;
};

export interface SurveyAnswers {
  favoriteGenres: string[];
  favoriteMovies: string[]; // custom titles
  preferredLanguages: string[];
  eraPreference: string;      // "classic", "modern", "contemporary", "no-preference"
  pacePreference: string;     // "slow-burn", "fast-paced", "balanced"
  themes: string[];           // "mind-bending", "feel-good", "dark", "thought-provoking", etc.
}

export interface Rating {
  movieId: string;
  movieTitle: string; // fallback
  score: number; // 1 to 5
  timestamp: string;
  review?: string;
}

export interface WatchlistItem {
  movie: Movie;
  addedAt: string;
  status: "watchlist" | "watched";
  userRating?: number; // rating given if watched
}

export interface UserSession {
  username: string;
  profileCreated: string;
  surveyAnswers?: SurveyAnswers;
}

export interface RecommendationResponse {
  recommendations: {
    movie: Movie;
    confidenceScore: number; // 0-100
    reason: string; // description of why the user will like it based on their inputs
    matchingFactor: string; // e.g., "Matches your love for Sci-Fi and Interstellar"
  }[];
}
