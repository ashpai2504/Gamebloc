# Gamebloc 🎮⚡

> **Real-time sports chat platform.** Click on any live game and join the conversation with other fans.

![Gamebloc](public/logo.svg)

## Features

- 🏟 **Live Match Listings** — Real-time scores for soccer & NCAA games
- 💬 **Per-Game Chat** — Every match has its own real-time chat room
- ⚽ **Soccer Leagues** — Premier League, La Liga, Bundesliga, Serie A, Ligue 1, UCL
- 🏈 **NCAA** — College Football & Basketball
- 🔐 **Auth** — Sign up to chat; browsing is open to everyone
- ⚡ **Real-time** — Socket.io powered live messaging & typing indicators
- 🎯 **Quick Reactions** — Send emoji reactions during live matches
- 📱 **Responsive** — Works on desktop, tablet, and mobile

## Tech Stack

| Layer      | Technology                                     |
| ---------- | ---------------------------------------------- |
| Framework  | Next.js 14 (App Router)                        |
| Language   | TypeScript                                     |
| Styling    | Tailwind CSS                                   |
| Auth       | NextAuth.js (Credentials + Google OAuth)       |
| Database   | MongoDB + Mongoose                             |
| Real-time  | Socket.io (custom Node.js server)              |
| State      | Zustand                                        |
| Soccer API | API-Football (via RapidAPI)                     |
| NCAA API   | ESPN public scoreboard API                     |
| Icons      | Lucide React                                   |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- (Optional) API-Football key from [RapidAPI](https://rapidapi.com/api-sports/api/api-football)

### 1. Install Dependencies

```bash
cd Gamebloc
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

| Variable             | Required | Description                           |
| -------------------- | -------- | ------------------------------------- |
| `MONGODB_URI`        | ✅        | MongoDB connection string             |
| `NEXTAUTH_SECRET`    | ✅        | Random secret for JWT signing         |
| `NEXTAUTH_URL`       | ✅        | App URL (http://localhost:3000)        |
| `FOOTBALL_API_KEY`   | ❌        | API-Football key (demo data without)  |
| `GOOGLE_CLIENT_ID`   | ❌        | Google OAuth client ID                |
| `GOOGLE_CLIENT_SECRET` | ❌     | Google OAuth client secret            |

> **Note:** The app works without an API key! It generates realistic demo data for all leagues so you can test the full experience.

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **Home Page** — Shows all matches grouped by status (Live → Upcoming → Finished)
2. **Filter** — Filter by sport (Soccer / NCAAF / NCAAB) and specific leagues
3. **Match Chat** — Click any match to open the chat room
4. **Authentication** — Sign up with email/password to send messages
5. **Real-time** — All messages are broadcast instantly via Socket.io
6. **Persistence** — Messages are saved to MongoDB for history

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes
│   │   ├── auth/           # NextAuth.js endpoints
│   │   ├── games/          # Game data endpoint
│   │   └── messages/       # Chat messages CRUD
│   ├── auth/               # Sign in / Sign up page
│   ├── match/[id]/         # Match detail + chat page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # React components
│   ├── AuthModal.tsx       # Login / Register form
│   ├── ChatMessage.tsx     # Individual chat message
│   ├── ChatWindow.tsx      # Full chat interface
│   ├── LeagueFilter.tsx    # Sport & league filter tabs
│   ├── LiveBadge.tsx       # Live/HT/FT status indicator
│   ├── MatchCard.tsx       # Match card component
│   ├── MatchList.tsx       # Grouped match list
│   ├── Navbar.tsx          # Top navigation bar
│   └── Providers.tsx       # Session provider wrapper
├── hooks/                  # Custom React hooks
│   ├── useGames.ts         # Game data fetching & caching
│   └── useSocket.ts        # Socket.io connection management
├── lib/                    # Server-side utilities
│   ├── auth.ts             # NextAuth configuration
│   ├── db.ts               # MongoDB connection
│   ├── models.ts           # Mongoose schemas
│   ├── sports-api.ts       # Sports data fetching
│   └── store.ts            # Zustand state stores
└── types/                  # TypeScript type definitions
    └── index.ts
```

## API Endpoints

| Method | Endpoint                  | Description              | Auth    |
| ------ | ------------------------- | ------------------------ | ------- |
| GET    | `/api/games`              | Fetch all games          | ❌       |
| GET    | `/api/games?leagues=pl,ucl` | Filter by leagues      | ❌       |
| GET    | `/api/messages/{gameId}`  | Fetch chat messages      | ❌       |
| POST   | `/api/messages/{gameId}`  | Send a message           | ✅       |

## Socket Events

| Event          | Direction | Description                     |
| -------------- | --------- | ------------------------------- |
| `join_room`    | Client→Server | Join a game chat room       |
| `leave_room`   | Client→Server | Leave a game chat room      |
| `send_message` | Client→Server | Send a chat message         |
| `new_message`  | Server→Client | Broadcast new message       |
| `room_users`   | Server→Client | Active user count update    |
| `user_joined`  | Server→Client | User joined notification    |
| `user_left`    | Server→Client | User left notification      |
| `typing`       | Client→Server | Start typing indicator      |
| `user_typing`  | Server→Client | Typing indicator broadcast  |

## Adding New Sports / Leagues

1. Add league definition to `src/types/index.ts`
2. Add API integration to `src/lib/sports-api.ts`
3. The UI automatically picks up new leagues in the filter

## License

MIT
