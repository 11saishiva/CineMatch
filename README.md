<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google# CineMatch

AI-powered movie recommendation platform built with React, TypeScript, Vite, Express, and Google Gemini.

CineMatch helps users discover movies based on their tastes, preferences, and viewing habits through an intelligent recommendation pipeline. Users can create accounts, complete a preference survey, maintain watchlists, and receive personalized movie suggestions generated using Gemini.

---

## Features

### AI-Powered Recommendations

* Personalized movie recommendations using Gemini 3.5 Flash
* Preference-based recommendation generation
* Backend recommendation processing
* Dynamic recommendations tailored to individual users

### Secure Authentication

* User registration and login
* SHA-256 password hashing
* JWT authentication
* Protected API endpoints
* Rate limiting against abuse and brute-force attempts

### User Experience

* Interactive onboarding survey
* Personalized dashboard
* Watchlist management
* User profile management
* Persistent session handling

### Modern Interface

* Dark cinematic theme
* Responsive design
* Smooth animations and transitions
* Genre-inspired visual presentation

---

# Screenshots

## Login

![Login Page](images/login.png)

## Onboarding Survey

![Onboarding Survey](images/Quiz.png)

## Discover Movies

![Discover Movies](images/discover.png)

## My Library

![My Library](images/my_library.png)

## User Profile

![User Profile](images/profile.png)

---

## Tech Stack

### Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* Lucide React

### Backend

* Express.js
* Node.js
* TypeScript

### AI & Recommendation Engine

* Google Gemini 3.5 Flash
* @google/genai SDK

### Security

* SHA-256 Password Hashing
* JWT Authentication
* AES-256 Encryption
* Rate Limiting Middleware

### Storage

* Local JSON Database (`data/db.json`)
* Session Cache Layer
* User Preference Persistence

---

## Project Structure

```text
.
├── data/
│   └── db.json
├── src/
│   ├── components/
│   │   ├── Auth.tsx
│   │   ├── Home.tsx
│   │   ├── MovieCard.tsx
│   │   ├── Navbar.tsx
│   │   ├── OnboardingSurvey.tsx
│   │   └── Profile.tsx
│   ├── data/
│   │   └── movies.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── types.ts
├── data/
│   └── db.json
├── server.ts
├── server-util.ts
├── package.json
└── vite.config.ts
```

## Installation

### Clone the Repository

```bash
git clone https://github.com/11saishiva/CineMatch.git
cd CineMatch
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file and add:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
TMDB_API_KEY=YOUR_TMDB_API_KEY
APP_URL=http://localhost:3000
```

### Start Development Server

```bash
npm run dev
```

---

## Security Features

* SHA-256 password hashing
* JWT session authentication
* AES-encrypted user preference storage
* Rate limiting middleware
* Server-side API key protection
* Protected recommendation endpoints

---

## Future Improvements

* Collaborative filtering recommendations
* Movie ratings and reviews
* Cloud database migration
* Recommendation feedback learning
* Social recommendation sharing
* Advanced recommendation analytics

---

## Author

**Sai Shiva**

Built to explore recommendation systems, AI integration, secure authentication, and modern full-stack application development.
.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/91161542-7f91-4425-a359-4146186170ea

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
