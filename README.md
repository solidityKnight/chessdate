# ChessDate 🎯♟️

A real-time chess-based dating platform where users are randomly matched with the opposite gender to play chess while chatting.

## Features

- **No Registration Required**: Jump straight into matchmaking
- **Gender-Based Matching**: Match with opposite gender only
- **Real-Time Chess**: Play chess with WebSocket synchronization
- **Live Chat**: Chat with your opponent during games
- **Automatic Matchmaking**: Redis-powered queue system
- **Server-Side Validation**: Chess.js ensures move validity
- **Disconnection Handling**: Automatic win for remaining player
- **Modern UI**: Dark theme inspired by Chess.com

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **TailwindCSS** for styling
- **Chessboard.jsx** for chess board UI
- **Socket.io Client** for real-time communication
- **Zustand** for state management
- **React Router** for navigation

### Backend
- **Node.js** with Express
- **Socket.io** for WebSocket server
- **Redis** for matchmaking queues and game state
- **Chess.js** for move validation
- **CORS & Helmet** for security

## Architecture

```
Users (Browser/Mobile)
        │
        │ WebSocket
        ▼
Realtime Server (Node.js + Socket.io)
        │
   ┌────┴────┐
   │         │
Matchmaking  Chess Engine
Service      (Chess.js)
   │         │
   ▼         ▼
Redis (Game state + queues)
```

## Project Structure

```
chessdate/
├── frontend/                 # React TypeScript app
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API and socket services
│   │   ├── store/           # Zustand store
│   │   ├── utils/           # Helper functions
│   │   └── App.tsx
│   ├── package.json
│   └── tailwind.config.js
│
└── backend/                  # Node.js server
    ├── sockets/             # Socket.io handlers
    ├── services/            # Business logic
    ├── redis/               # Redis client
    ├── config/              # Configuration
    ├── models/              # Data models
    └── server.js
```

## Getting Started

> ⚠️ **Important**: the frontend must know where the socket server lives. During local
> development this typically runs on port **4000** while the React dev server
> runs on **3000**. The client will default to `window.location.origin` which
> points to port 3000, causing the infamous "Connecting to server..." spinner
> forever. Be sure to set `REACT_APP_BACKEND_URL` to `http://localhost:4000` (or
> use the provided proxy in `package.json`) or upgrade to a release that
> includes the automatic 3000→4000 fallback.

### Prerequisites

- Node.js (v16 or higher)
- Redis server
- npm or yarn

### Installation

1. **Clone and setup backend:**
   ```bash
   cd backend
   npm install
   ```

2. **Setup frontend:**
   ```bash
   cd frontend
   npm install
   ```

3. **Start Redis server:**
   ```bash
   redis-server
   ```

4. **Start backend server:**
   ```bash
   cd backend
   npm run dev
   ```

5. **Start frontend (in new terminal):**
   ```bash
   cd frontend
   npm start
   ```

The app will be available at `http://localhost:3000`

## Game Flow

1. **Landing Page**: User selects gender (Male/Female)
2. **Matchmaking**: Added to gender-specific queue
3. **Game Start**: Matched with opposite gender, assigned colors
4. **Chess Play**: Real-time chess with move validation
5. **Chat**: Send messages to opponent during game
6. **Game End**: Win by checkmate, resignation, or disconnect
7. **New Match**: Option to find new opponent

## API Endpoints

### WebSocket Events

#### Client → Server
- `select_gender`: Join matchmaking queue
- `cancel_matchmaking`: Leave queue
- `make_move`: Make chess move
- `resign_game`: Resign current game
- `send_message`: Send chat message
- `request_new_game`: Find new opponent

#### Server → Client
- `waiting_for_match`: Queue status update
- `game_start`: Game initialization
- `move_made`: Opponent move notification
- `game_over`: Game end notification
- `chat_message`: New chat message
- `opponent_disconnected`: Player disconnect

## Configuration

### Environment Variables

This project does **not require any `.env` files**; all configuration is handled
via environment variables which can be set directly in your shell or via your
hosting platform's dashboard. Defaults are provided in code when the variables
are missing, allowing the application to run locally with zero configuration.

For example:
```bash
# backend
export PORT=4000
export REDIS_HOST=localhost
export REDIS_PORT=6379
export FRONTEND_URL=http://localhost:3000

# frontend (before running build/start)
export REACT_APP_BACKEND_URL=http://localhost:4000
export REACT_APP_API_URL=http://localhost:4000/api
```

On Railway, Vercel, Netlify, etc., you can simply add those names/values in the
project settings. No files are checked in or needed.

## Deployment

### Root Repository Scripts
The repo includes a root-level `package.json` so that a single `npm install` and `npm start` from the project root will prepare and launch the **backend service**. Railway (and other PaaS providers) will automatically detect the Node.js app and use the `start` script defined here.

```json
// root/package.json (selected scripts)
{
  "scripts": {
    "install": "cd backend && npm ci && cd ../frontend && npm ci",
    "start": "cd backend && npm run start",
    "build:frontend": "cd frontend && npm run build",
    "build": "npm run build:frontend"
  }
}
```

Run from the root directory:
```bash
npm install      # installs both backend and frontend deps
npm start        # starts backend (listen on PORT env or 4000)
```

You can also run `npm run dev` locally to launch both servers concurrently with hot reload.

### Backend Deployment (Railway, Render, etc.)
- Point the service to this repository
- Railway will run `npm install` then `npm start` automatically
  (the `install` script builds the frontend; `start` launches the backend)

> **Deployment tip:**
> - Define `FRONTEND_URL` on the backend service (if the front‑end is split)
>   so the CORS check can allow traffic from the client domain.
> - For a single combined service where the backend serves the static
>   build, no extra variables are required.
>
> When deploying the client separately, set `REACT_APP_BACKEND_URL` in the
> frontend project’s Railway environment to the *backend* URL (e.g.
> `https://xxx.up.railway.app`). Otherwise the client will default to
> `window.location.origin` and try to connect to itself, resulting in the
> "connecting to server" spinner.
- The server will serve the React production build from `frontend/build` when
  `NODE_ENV=production` (Railway sets this automatically) or if you set
  `SERVE_FRONTEND=true`.
- **CRITICAL: Set up Redis** – Railway has a Redis plugin. Add it to your project
  and set these environment variables:
  - `REDIS_HOST` = the Redis URL (Railway provides this)
  - `REDIS_PORT` = usually 6379
- Alternatively include a `Procfile` (`web: npm start`) for explicit command
- Check Railway logs for Redis connection status and socket connections
- Visit `/health` endpoint to verify Redis connectivity

### Frontend Deployment
The frontend is a standalone React app. To build it for production:

```bash
cd frontend
npm run build
```

The result is a static `build/` directory. There are two common deployment
patterns:

1. **Serve via the backend** – the backend (see above) will automatically
   use the files in `frontend/build` when starting in production. This makes a
   single Railway project serve both API and UI; just ensure you run the build
   step (the root `install` script does this). In this configuration the
   frontend automatically connects to the socket on the same origin, so you do
   not need any additional environment variables.

2. **Deploy separately** – push `frontend/build` to Vercel, Netlify, GitHub
   Pages, etc. Configure `REACT_APP_BACKEND_URL` to point at the Railway
   backend URL so the client knows where to connect. This value is baked into
   the build at compile time.

You can still build from the monorepo root with:
```bash
npm run build           # runs frontend build via root script
```

## Future Enhancements

- **Premium Features**: Video chat, tournaments, AI opponents
- **Ratings System**: Elo-based matchmaking
- **Profile System**: User profiles with photos
- **Mobile Apps**: React Native implementation
- **Analytics**: Game statistics and insights
- **Tournaments**: Organized competitions
- **Gifts/Tipping**: In-game monetization

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License - see LICENSE file for details

---

**Made with ❤️ for chess lovers and hopeful romantics**#   c h e s s d a t e 
 
 