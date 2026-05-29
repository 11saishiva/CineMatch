# CineMatch

An AI-powered movie recommendation platform built with React, TypeScript, Vite, Express, and Google Gemini.

CineMatch helps users discover movies tailored to their tastes through a personalized onboarding survey and an intelligent recommendation pipeline. The platform combines modern recommendation systems, secure authentication, encrypted user data storage, and a responsive cinematic interface to create a personalized movie discovery experience.

---

## Features

### AI-Powered Recommendations

* Personalized movie recommendations powered by Google Gemini 3.5 Flash
* Dynamic recommendation generation based on user interests, genres, pacing preferences, and viewing habits
* Backend recommendation pipeline for secure model interactions
* Context-aware movie discovery without relying solely on predefined recommendation matrices

### Authentication & Security

* User registration and login system
* SHA-256 password hashing before database storage
* JWT-based authentication and protected API routes
* AES-256-CBC encryption for privacy-sensitive onboarding survey responses
* Rate limiting to reduce abuse and brute-force attempts

### Session Management

* Redis-inspired in-memory session cache
* Automatic cleanup of expired sessions
* Persistent authenticated user sessions
* Fast session lookups without database overhead

### User Experience

* Interactive onboarding survey
* Personalized recommendation dashboard
* Watchlist management
* User profile management
* Persistent user preferences and viewing history

### Modern Interface

* Dark cinematic theme
* Responsive design across devices
* Smooth animations and transitions
* Genre-inspired visual presentation

---
## System Architecture

![System Architecture](./images/architecture.png)
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
* AES-256-CBC Encryption
* JWT Authentication
* Rate Limiting Middleware

### Session Layer

* Virtual Redis-style In-Memory Session Cache
* Automatic Expired Session Cleanup
* Fast Token Validation

### Storage

* Local JSON Database (`data/db.json`)
* User Profile Storage
* Watchlist Persistence
* Encrypted Preference Storage

---

## Security Architecture

### SHA-256 Password Hashing

User passwords are hashed using SHA-256 before storage, ensuring plaintext credentials are never written to the database.

### AES-256-CBC Encryption

Privacy-sensitive onboarding survey responses are encrypted using AES-256-CBC before persistence and are only decrypted when authenticated users access their profiles.

### JWT Authentication

Authenticated API access is protected through JSON Web Tokens, preventing unauthorized access to personalized resources.

### In-Memory Session Cache

Session tokens are mapped through a Redis-inspired in-memory session manager featuring automatic expiration handling and periodic garbage collection for stale sessions.

---

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
npm install
npm run dev
```

---

## Future Improvements

* Collaborative filtering recommendations
* Movie ratings and reviews
* Cloud database integration
* Recommendation feedback learning
* Social movie sharing
* Recommendation explainability and analytics

---

## Author

**Sai Shiva**

Built to explore AI-powered recommendation systems, secure authentication architectures, encrypted data storage, and modern full-stack web application development.
