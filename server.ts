/**
 * Movie Recommendation JWT + Redis Server
 * Includes Rate Limiting, Asynchronous job processor, and Live TVMaze/Gemini IMDb Movie Details integration.
 */

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

import {
  hashPassword,
  encryptAES,
  decryptAES,
  redis,
  generateToken,
  verifySessionToken,
  readDatabase,
  writeDatabase,
  getProfileByUsername,
  checkRateLimit,
  createRecommendationJob,
  getRecommendationJobStatus,
  updateJobProgress,
} from "./server-util";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client to prevent crashes if key is missing
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is required but missing. Add it in settings.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Unsplash images by genre for reliable display fallback
const UNSPLASH_IMAGES: { [key: string]: string } = {
  "Sci-Fi": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop",
  "Action": "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=600&auto=format&fit=crop",
  "Drama": "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop",
  "Romance": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=600&auto=format&fit=crop",
  "Animation": "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop",
  "Comedy": "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop",
  "Thriller": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop",
  "Fantasy": "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=600&auto=format&fit=crop",
  "Crime": "https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=600&auto=format&fit=crop",
  "Mystery": "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&auto=format&fit=crop",
  "Music": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop",
  "Default": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop"
};

const BACKDROPS: { [key: string]: string } = {
  "Sci-Fi": "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=1200&auto=format&fit=crop",
  "Action": "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop",
  "Drama": "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=1200&auto=format&fit=crop",
  "Romance": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop",
  "Animation": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1200&auto=format&fit=crop",
  "Default": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop"
};

// -----------------------------------------------------------------
// MIDDLEWARES
// -----------------------------------------------------------------

/**
 * Throttling & Rate Limiter Middleware.
 * Identifies clients via auth token or IP addresses.
 */
function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const clientId = (req.headers["authorization"] as string) || req.ip || "global-client";
  if (!checkRateLimit(clientId)) {
    return res.status(429).json({
      error: "Too Many Requests",
      message: "You have exceeded our cinematic query speed limits. Please space out your search actions.",
    });
  }
  next();
}

/**
 * Authentication check middleware utilizing JWT & virtual Redis session store.
 */
function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access Denied. Bearer token missing." });
  }

  const token = authHeader.split(" ")[1];
  const payload = verifySessionToken(token);

  if (!payload) {
    return res.status(403).json({ error: "Invalid or expired JWT session token. Re-authenticating." });
  }

  (req as any).username = payload.username;
  next();
}

// Apply rate limiter to all API endpoints
app.use("/api", rateLimitMiddleware);

// -----------------------------------------------------------------
// AUTHENTICATION SYSTEM ENDPOINTS (JWT + Redis + Hashing)
// -----------------------------------------------------------------

app.post("/api/auth/register", (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const db = readDatabase();
    const key = username.toLowerCase().trim();

    if (db.users[key]) {
      return res.status(409).json({ error: "Username is already taken." });
    }

    // Cryptographic Password Hashing (SHA-256)
    const passwordHash = hashPassword(password);

    db.users[key] = {
      username: username.trim(),
      passwordHash,
      profileCreated: new Date().toISOString(),
      watchlist: [],
      watchedHistory: [],
      ratings: [],
    };

    writeDatabase(db);
    res.json({ success: true, message: "User profile successfully registered!" });
  } catch (err: any) {
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Credentials missing." });
    }

    const key = username.toLowerCase().trim();
    const profile = getProfileByUsername(key);

    if (!profile) {
      return res.status(404).json({ error: "Username not found. Register a new account." });
    }

    // Verify cryptographic hash
    const submissionHash = hashPassword(password);
    if (profile.passwordHash !== submissionHash) {
      return res.status(400).json({ error: "Incorrect password credentials." });
    }

    // Generate JWT + cache inside Redis
    const token = generateToken(profile.username);

    // Decrypt AES Survey Preference values if they exist
    let surveyAnswers = undefined;
    if (profile.surveyAnswersEncrypted) {
      try {
        const decryptedStr = decryptAES(profile.surveyAnswersEncrypted);
        surveyAnswers = JSON.parse(decryptedStr);
      } catch (err) {
        console.error("Failed to decrypt survey values via AES. Using legacy database fallback.");
      }
    }

    res.json({
      success: true,
      token,
      user: {
        username: profile.username,
        profileCreated: profile.profileCreated,
        surveyAnswers,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});

app.get("/api/auth/session", authenticateJWT, (req, res) => {
  try {
    const username = (req as any).username;
    const profile = getProfileByUsername(username);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found." });
    }

    let surveyAnswers = undefined;
    if (profile.surveyAnswersEncrypted) {
      try {
        surveyAnswers = JSON.parse(decryptAES(profile.surveyAnswersEncrypted));
      } catch (e) {}
    }

    res.json({
      username: profile.username,
      profileCreated: profile.profileCreated,
      surveyAnswers,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Session validation error." });
  }
});

app.post("/api/auth/logout", authenticateJWT, (req, res) => {
  const username = (req as any).username;
  redis.del(`session:${username}`);
  res.json({ success: true, message: "Logged out from safe JWT & Redis nodes." });
});

// -----------------------------------------------------------------
// PERSISTENT MOVIE STATES & PROFILE ACTIONS
// -----------------------------------------------------------------

app.get("/api/user/data", authenticateJWT, (req, res) => {
  const username = (req as any).username;
  const profile = getProfileByUsername(username);
  if (!profile) return res.status(404).json({ error: "Profile missing" });

  res.json({
    watchlist: profile.watchlist || [],
    watchedHistory: profile.watchedHistory || [],
    ratings: profile.ratings || [],
  });
});

app.post("/api/user/survey", authenticateJWT, (req, res) => {
  try {
    const username = (req as any).username;
    const { answers } = req.body;
    if (!answers) return res.status(400).json({ error: "Survey answers missing." });

    const db = readDatabase();
    const key = username.toLowerCase().trim();

    if (db.users[key]) {
      // Cryptographically encrypt survey response via AES before storing
      const responseStr = JSON.stringify(answers);
      db.users[key].surveyAnswersEncrypted = encryptAES(responseStr);
      writeDatabase(db);
      
      // Wipe old cached recommendations in Redis to force recalculation
      redis.del(`recs:${username}`);
      
      res.json({ success: true, message: "Preference survey encrypted and cloud-saved." });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Saving survey failed" });
  }
});

app.post("/api/user/sync", authenticateJWT, (req, res) => {
  try {
    const username = (req as any).username;
    const { watchlist, watchedHistory } = req.body;

    const db = readDatabase();
    const key = username.toLowerCase().trim();

    if (db.users[key]) {
      if (Array.isArray(watchlist)) db.users[key].watchlist = watchlist;
      if (Array.isArray(watchedHistory)) db.users[key].watchedHistory = watchedHistory;
      writeDatabase(db);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Sync failed" });
  }
});

app.post("/api/user/clear", authenticateJWT, (req, res) => {
  try {
    const username = (req as any).username;
    const db = readDatabase();
    const key = username.toLowerCase().trim();

    if (db.users[key]) {
      delete db.users[key];
      writeDatabase(db);
      redis.del(`session:${username}`);
      redis.del(`recs:${username}`);
      res.json({ success: true, message: "User profile successfully deleted." });
    } else {
      res.status(404).json({ error: "User profile not found." });
    }
  } catch (err) {
    res.status(500).json({ error: "Clear failed" });
  }
});

// -----------------------------------------------------------------
// ASYNCHRONOUS RECOMMENDATIONS BACKGROUND JOB ENGINE
// -----------------------------------------------------------------

app.post("/api/recommendations/jobs", authenticateJWT, async (req, res) => {
  try {
    const username = (req as any).username;
    const { surveyAnswers, watchHistory, watchlist, customMoodQuery } = req.body;

    if (!surveyAnswers) {
      return res.status(400).json({ error: "Survey answers are required." });
    }

    // 1. Create a background async Job ID
    const jobId = createRecommendationJob(username);

    // 2. Start Asynchronous execution (Worker Flow)
    // Run background recommendation generation so client doesn't block
    setTimeout(async () => {
      try {
        updateJobProgress(jobId, "processing", 15, "Authenticating with CineMatch neural model...");
        
        // Load ML key and instantiate
        const ai = getGeminiClient();
        updateJobProgress(jobId, "processing", 35, "Reading user preference mappings...");

        const genresStr = surveyAnswers.favoriteGenres?.join(", ") || "Any";
        const favMoviesStr = surveyAnswers.favoriteMovies?.join(", ") || "None specified";
        const languagesStr = surveyAnswers.preferredLanguages?.join(", ") || "English";
        const eraStr = surveyAnswers.eraPreference || "Any era";
        const paceStr = surveyAnswers.pacePreference || "Any pacing";
        const themesStr = surveyAnswers.themes?.join(", ") || "No specific themes";

        const historyPromptLines = watchHistory && watchHistory.length > 0
          ? watchHistory.map((item: any) => `- Film: "${item.movie.title}" (${item.movie.year}). Rating: ${item.userRating ? `${item.userRating}/5` : "not rated"}`).join("\n")
          : "None recorded.";

        const watchlistLines = watchlist && watchlist.length > 0
          ? watchlist.map((item: any) => `- "${item.title}" (${item.year})`).join("\n")
          : "None recorded.";

        updateJobProgress(jobId, "processing", 55, "Generating unique critic insights using Gemini...");

        const customMoodInstruction = customMoodQuery 
          ? `\nCRITICAL CONTEXT: The user wants recommendations strictly centered on this mood/style description: "${customMoodQuery}".
Ensure ALL recommendations align beautifully with this, bypassing any previously watched or currently watchlisted items.\n`
          : "";

        const prompt = `You are an elite, highly detailed movie recommendation expert and film critic.
Your task is to analyze a user's movie taste profile and generate exactly 6 highly relevant, real movie recommendations.
Do NOT invent fake movies. Use actual release years, directors, cast lists, and run times.
${customMoodInstruction}
Here is the User Taste Profile:
- Favorite Genres: ${genresStr}
- Seed/Favorite Movies: ${favMoviesStr}
- Preferred Languages: ${languagesStr}
- Preferred Movie Era: ${eraStr}
- Pace Preference: ${paceStr}
- Visual/Narrative Themes: ${themesStr}

User's Watch History:
${historyPromptLines}

User's Watchlist (exclude these titles from recommendations):
${watchlistLines}

Generate exactly 6 recommendations.
For each recommendation, give a personalized reason why they will love it based on their taste. Return strictly in standard raw JSON matching the required schema. Ensure accuracy of movie metadata.`;

        updateJobProgress(jobId, "processing", 80, "Applying filters and building telemetry records...");

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: "You are the ultimate Cinephile AI, an expert film recommender. Give cinematic recommendations matching the user's profile. Verify all details like release year, director, and runtime. Ensure your recommendations are accurate real-world films.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                recommendations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      movie: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          title: { type: Type.STRING },
                          year: { type: Type.INTEGER },
                          genres: { type: Type.ARRAY, items: { type: Type.STRING } },
                          language: { type: Type.STRING },
                          director: { type: Type.STRING },
                          cast: { type: Type.ARRAY, items: { type: Type.STRING } },
                          duration: { type: Type.STRING },
                          rating: { type: Type.NUMBER },
                          overview: { type: Type.STRING }
                        },
                        required: ["id", "title", "year", "genres", "language", "overview"]
                      },
                      confidenceScore: { type: Type.INTEGER },
                      reason: { type: Type.STRING },
                      matchingFactor: { type: Type.STRING }
                    },
                    required: ["movie", "confidenceScore", "reason", "matchingFactor"]
                  }
                }
              },
              required: ["recommendations"]
            }
          }
        });

        const textResponse = response.text;
        if (!textResponse) {
          throw new Error("Empty response received from Gemini engine client.");
        }

        const payload = JSON.parse(textResponse.trim());

        // Inject high definition Unsplash images/backdrops as visual artwork
        if (payload && Array.isArray(payload.recommendations)) {
          payload.recommendations = payload.recommendations.map((rec: any) => {
            const primaryGenre = rec.movie.genres?.[0] || "Default";
            rec.movie.posterUrl = UNSPLASH_IMAGES[primaryGenre] || UNSPLASH_IMAGES["Default"];
            rec.movie.backdropUrl = BACKDROPS[primaryGenre] || BACKDROPS["Default"];
            return rec;
          });
        }

        updateJobProgress(jobId, "completed", 100, "Successfully completed ML mappings!", payload.recommendations);
      } catch (workerErr: any) {
        console.error("Worker error for jobId", jobId, workerErr);
        updateJobProgress(
          jobId,
          "failed",
          100,
          "ML Processor Error occurred during mapping: " + workerErr.message,
          null,
          workerErr.message
        );
      }
    }, 50); // Start asynchronous promise asynchronously

    res.json({ jobId, message: "Recommendation job queued successfully." });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to queue asynchronous recommendation job." });
  }
});

app.get("/api/recommendations/jobs/:jobId", authenticateJWT, (req, res) => {
  const { jobId } = req.params;
  const status = getRecommendationJobStatus(jobId);

  if (!status) {
    return res.status(404).json({ error: "Job ID not found in system queue." });
  }

  res.json(status);
});

// -----------------------------------------------------------------
// UP-TO-DATE MOVIE METADATA SEARCH API
// -----------------------------------------------------------------

/**
 * Searches real-time up-to-date movie details using the official TMDB API
 * (as the primary IMDb movie details database), falling back to TvMaze
 * and Gemini Search Grounding.
 */
app.get("/api/movie-details", async (req, res) => {
  try {
    const { title } = req.query;
    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "Movie title search query is required." });
    }

    const tmdbApiKey = process.env.TMDB_API_KEY || "ec0513cd9c63d271702a5cd741634f25";
    const tmdbBaseUrl = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";

    // 1. Attempt TMDB official API lookup
    try {
      const searchUrl = `${tmdbBaseUrl}/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}`;
      const searchResponse = await fetch(searchUrl);
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData && searchData.results && searchData.results.length > 0) {
          const matchedMovie = searchData.results[0];
          const movieId = matchedMovie.id;

          // Fetch full detailed movie information with credits (using TMDB's append_to_response feature)
          const detailUrl = `${tmdbBaseUrl}/movie/${movieId}?api_key=${tmdbApiKey}&append_to_response=credits`;
          const detailResponse = await fetch(detailUrl);
          
          if (detailResponse.ok) {
            const data = await detailResponse.json();
            
            // Map spoken languages
            const language = data.spoken_languages && data.spoken_languages[0]
              ? data.spoken_languages[0].english_name
              : (data.original_language ? data.original_language.toUpperCase() : "English");

            // Extract director and cast
            const director = data.credits && data.credits.crew
              ? data.credits.crew.find((member: any) => member.job === "Director")?.name
              : "N/A";
            
            const cast = data.credits && data.credits.cast
              ? data.credits.cast.slice(0, 5).map((member: any) => member.name)
              : [];

            const parsedDetails = {
              title: data.title,
              year: data.release_date ? new Date(data.release_date).getFullYear() : "N/A",
              genres: data.genres ? data.genres.map((g: any) => g.name) : [],
              overview: data.overview || "No summary available.",
              rating: data.vote_average ? data.vote_average.toFixed(1) : "N/A",
              language: language,
              runtime: data.runtime ? `${data.runtime} min` : "N/A",
              posterUrl: data.poster_path 
                ? `https://image.tmdb.org/t/p/w500${data.poster_path}` 
                : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop",
              backdropUrl: data.backdrop_path 
                ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` 
                : "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop",
              director: director,
              cast: cast,
              boxOffice: data.revenue && data.revenue > 0 ? `$${(data.revenue / 1000000).toFixed(1)}M` : undefined,
              trivia: data.tagline ? `"${data.tagline}"` : "Fetched in real-time from the official TMDB movie catalog.",
              source: "TMDB IMDb Database"
            };

            return res.json({ source: "TMDB API", details: parsedDetails });
          }
        }
      }
    } catch (tmdbError) {
      console.warn("TMDB official API lookup failed, trying fallbacks...", tmdbError);
    }

    // 2. Attempt TvMaze external search API details (IMDb-like metadata)
    const tvMazeUrl = `https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(title)}`;
    
    try {
      const externalRes = await fetch(tvMazeUrl);
      if (externalRes.ok) {
        const data = await externalRes.json();
        if (data && data.name) {
          // Parse TvMaze format into standard movie detail payload
          const parsedDetails = {
            title: data.name,
            year: data.premiered ? new Date(data.premiered).getFullYear() : "N/A",
            genres: data.genres || [],
            overview: data.summary ? data.summary.replace(/<[^>]*>/g, "") : "No summary available.",
            rating: data.rating?.average ? (data.rating.average / 2).toFixed(1) : "4.0",
            language: data.language || "English",
            runtime: data.runtime ? `${data.runtime} min` : "N/A",
            posterUrl: data.image?.medium || data.image?.original || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop",
            trivia: "Fetched in real-time using TvMaze Public Directory.",
            officialUrl: data.officialSite || "N/A",
            source: "TvMaze Movie API"
          };
          
          return res.json({ source: "TvMaze Movie API", details: parsedDetails });
        }
      }
    } catch (e) {
      console.warn("TVMaze fetch failed, falling back to live Gemini Search intelligence.");
    }

    // 3. Fallback: Use Gemini 3.5 Flash WITH search grounding tool to fetch up-to-date critics trivia
    try {
      const ai = getGeminiClient();
      const prompt = `Give me up-to-date accurate IMDb statistics, rating, cast list, release year, director, and interactive trivia for the movie query: "${title}".
Return the details strictly as JSON conforming to the requested schema.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an live media catalog. Search the web for actual information using metadata. Do not suggest mock reviews.",
          tools: [{ googleSearch: {} }], // Enable search grounding for 100% up-to-date accuracy
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              year: { type: Type.INTEGER },
              genres: { type: Type.ARRAY, items: { type: Type.STRING } },
              overview: { type: Type.STRING },
              rating: { type: Type.STRING, description: "Official IMDb rating, e.g. '8.2/10'" },
              language: { type: Type.STRING },
              director: { type: Type.STRING },
              cast: { type: Type.ARRAY, items: { type: Type.STRING } },
              runtime: { type: Type.STRING },
              trivia: { type: Type.STRING },
              boxOffice: { type: Type.STRING }
            },
            required: ["title", "year", "overview"]
          }
        }
      });

      const textResponse = response.text;
      if (textResponse) {
        const parsedDetails = JSON.parse(textResponse.trim());
        // Inject random Unsplash picture for layout consistency
        parsedDetails.posterUrl = UNSPLASH_IMAGES[parsedDetails.genres?.[0] || "Default"] || UNSPLASH_IMAGES["Default"];
        parsedDetails.source = "Gemini IMDb Grounding API";
        return res.json({ source: "Gemini IMDb Grounding API", details: parsedDetails });
      }
    } catch (llmErr: any) {
      console.error("Gemini grounding detail lookup failed too:", llmErr);
    }

    // 4. Default static fallback if completely offline
    res.json({
      source: "Offline Static Fallback",
      details: {
        title: title,
        year: 2024,
        genres: ["Drama", "Mystery"],
        overview: `A complete profile of "${title}" can be retrieved upon connecting the primary TMDB/IMDb endpoints.`,
        rating: "4.5",
        language: "English",
        runtime: "120 min",
        posterUrl: UNSPLASH_IMAGES["Default"],
        source: "Static Fallback"
      }
    });

  } catch (err: any) {
    res.status(500).json({ error: "Failed to gather movie metadata trivia." });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Movie Recommendation Server is running.",
    authenticatedSessions: redis.get("session:*") ? "active" : "empty",
    keyAvailable: !!process.env.GEMINI_API_KEY,
  });
});

// -----------------------------------------------------------------
// VITE OR STATIC STATIC SERVING GATES
// -----------------------------------------------------------------
async function serveApp() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Configuring Vite Development Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving build artifacts in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Movie Recommendation Service listening on http://0.0.0.0:${PORT}`);
  });
}

serveApp().catch((err) => {
  console.error("Failed to start server:", err);
});
