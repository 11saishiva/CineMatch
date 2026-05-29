# CineMatch

An AI-powered movie recommendation platform built with React, TypeScript, Vite, Express, and Google Gemini.

CineMatch helps users discover movies tailored to their tastes through a personalized onboarding survey and an intelligent recommendation pipeline. Users can create accounts, manage watchlists, explore recommendations, and maintain personalized movie preferences through a modern full-stack web application.

---

## Features

### AI-Powered Recommendations

* Personalized movie recommendations using Google Gemini 3.5 Flash
* Preference-based recommendation generation
* Dynamic recommendation pipeline running through the backend
* Recommendations generated from user interests, genres, pacing preferences, and viewing habits

### Authentication & Security

* User registration and login
* SHA-256 password hashing
* JWT-based authentication
* Protected API routes
* Rate limiting to prevent abuse and brute-force attacks

### User Experience

* Interactive onboarding survey
* Personalized movie dashboard
* Watchlist management
* User profile management
* Persistent user sessions

### Modern Interface

* Dark cinematic theme
* Responsive design
* Smooth animations and transitions
* Genre-focused visual presentation

---

## Screenshots

### Login

![Login](./images/login.png)

### Onboarding Survey

![Survey](./images/Quiz.png)

### Discover Movies

![Discover](./images/discover.png)

### My Library

![Library](./images/my_library.png)

### User Profile

![Profile](./images/profile.png)

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

### AI Integration

* Google Gemini 3.5 Flash
* @google/genai SDK

### Security

* SHA-256 Password Hashing
* JWT Authentication
* AES-256 Encryption
* Rate Limiting Middleware

### Storage

* Local JSON Database
* Session Cache Layer
* Watchlist Persistence
* User Preference Storage

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
├── server.ts
├── server-util.ts
├── data/
│   └── db.json
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

Create a `.env` file:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
TMDB_API_KEY=YOUR_TMDB_API_KEY
APP_URL=http://localhost:3000
```

### Start the Application

```bash
npm run dev
```

---

## Security Features

* SHA-256 password hashing before storage
* JWT-based session authentication
* AES-encrypted preference storage
* Request rate limiting
* Server-side API key protection
* Protected recommendation endpoints

---

## Future Improvements

* Collaborative filtering recommendations
* Movie ratings and reviews
* Cloud database integration
* Recommendation feedback learning
* Social movie sharing
* Advanced recommendation analytics

---

## Author

**Sai Shiva**

Built to explore recommendation systems, AI integration, secure authentication, and modern full-stack application development.
