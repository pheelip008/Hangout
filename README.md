<div align="center">

<img src="client/public/hangout1.png" alt="Hangout" width="280" />

**Video meetings with a 3D room you can actually walk around in.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Three.js](https://img.shields.io/badge/three.js-r185-000000?logo=threedotjs&logoColor=white)](https://threejs.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Node](https://img.shields.io/badge/Node-Express%205-339933?logo=nodedotjs&logoColor=white)](https://expressjs.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white)](https://socket.io)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org)

</div>

---

<div align="center">
<table>
  <tr>
    <td><img src="client/public/readmeimages/1.png" alt="Screenshot 1" width="240" /></td>
    <td><img src="client/public/readmeimages/2.png" alt="Screenshot 2" width="240" /></td>
    <td><img src="client/public/readmeimages/3.png" alt="Screenshot 3" width="240" /></td>
    <td><img src="client/public/readmeimages/4.png" alt="Screenshot 4" width="240" /></td>
  </tr>
</table>
</div>

## What is this?

Hangout is a WebRTC video-conferencing app with a twist. At any point during a call you can drop into the **playground**, a shared 3D living room rendered with Three.js, where every participant becomes an avatar whose head is a live screen playing their webcam feed.

Walk around with WASD, sit on the couch, wave at people, and watch a shared screen on the in-world TV. Press `P` and you are back in the normal video grid. Same call, same peers, same connection, just a different way of being in the room together.

Media is peer-to-peer WebRTC in a mesh topology. Avatar movement, seating and presence ride on the **same Socket.IO connection** already used for signalling, so entering the playground costs no extra handshake.

## Features

**Meetings**

- Instant meetings and scheduled meetings, each with a shareable `HGT-XXX-XXXX` room code
- Peer-to-peer audio/video over WebRTC, with mute and camera toggles
- Screen sharing via `getDisplayMedia`, delivered to peers as a second stream
- Live participant panel, meeting timer, recent and upcoming meeting lists

**The 3D playground**

- A hand-built living room: walls, floor, couch, coffee table and a working TV
- Third- and first-person camera, pointer-lock mouse look, collision detection
- Avatars with idle / walk / sit animations and three gestures
- **Head tracking in first-person**, your avatar's head follows where you look, layered on top of the running animation and synced to everyone in the room
- **Face screens**, each avatar's head renders that participant's live camera feed as a `THREE.VideoTexture`
- Four networked couch seats, claimed first-come-first-served and synced to everyone
- Whoever is screen sharing gets mirrored onto the in-world TV

**Accounts**

- Email and password (bcrypt) or Google OAuth 2.0
- JWT issued in an `httpOnly` cookie, verified on both REST routes and the Socket.IO handshake
- Meeting participation is checked server-side before you are allowed into a room

## Architecture

```mermaid
flowchart LR
    subgraph BA["Browser — Peer A"]
        A1["React UI<br/>video grid"]
        A2["Three.js playground"]
    end

    subgraph BB["Browser — Peer B"]
        B1["React UI<br/>video grid"]
        B2["Three.js playground"]
    end

    S["Express + Socket.IO"]
    DB[("PostgreSQL<br/>via Prisma")]
    T["Metered TURN / Google STUN"]

    A1 <-->|"WebRTC media — peer to peer"| B1
    A1 -->|"SDP + ICE"| S
    B1 -->|"SDP + ICE"| S
    A2 -->|"position, animation, seats"| S
    B2 -->|"position, animation, seats"| S
    A1 -.->|"MediaStream handoff"| A2
    B1 -.->|"MediaStream handoff"| B2
    S --> DB
    A1 -.->|"relay fallback"| T
```

The server never touches media. It relays SDP offers and answers plus ICE candidates between peers, then relays avatar state for anyone who has also joined the game room. The same `MediaStream` objects that feed the `<video>` tags in the grid are handed straight to the playground and mounted as video textures, the camera is captured once and reused.

Glare is handled with a polite/impolite peer scheme (a `socket.id` comparison decides who yields), so simultaneous offers during renegotiation do not deadlock the connection.

### Rooms

Each meeting maps to two Socket.IO rooms:

| Room | Purpose | Capacity |
| --- | --- | --- |
| `<roomCode>` | Signalling and presence for the video call | unlimited |
| `game-<roomCode>` | Avatar state for the 3D playground | **3 players** (server-enforced) |

You join the first on entering the meeting and the second only when you open the playground, so people who never open it cost nothing.

## Getting started

### Prerequisites

- **Node.js 20+** and npm
- A **PostgreSQL** database, local or hosted
- A **Google OAuth 2.0** client, only if you want social login
- A **[Metered](https://www.metered.ca/)** account, only if you need TURN relay (see the note below)

### 1. Clone and install

```bash
git clone https://github.com/pheelip008/Hangout.git
```

```bash
cd Hangout/server && npm install
```

```bash
cd ../client && npm install
```

### 2. Configure the server

Create `server/.env`:

```ini
DATABASE_URL="postgresql://user:password@localhost:5432/hangout"

JWT_SECRET="a-long-random-string"
JWT_EXPIRES_IN="7d"

CLIENT_ORIGIN="http://localhost:5173"
PORT=3000

# Google OAuth — optional, omit to use email/password only
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

# TURN relay — optional for local testing
METERED_DOMAIN="yoursubdomain.metered.live"
METERED_API_KEY="..."
```

### 3. Configure the client

Create `client/.env`:

```ini
VITE_API_BASE="http://localhost:3000"
```

### 4. Set up the database

```bash
cd server && npx prisma migrate dev && npx prisma generate
```

### 5. Run both processes

```bash
cd server && npm run dev
```

```bash
cd client && npm run dev
```

The client is at **http://localhost:5173** and the API at **http://localhost:3000**.

> **Testing with two people locally:** open the app in two different browsers, or one normal window and one private window, then sign in as two different users. Both accounts must be participants of the meeting — join with the room code from the home page rather than pasting the meeting URL directly.

> **A note on TURN:** two peers on the same network will usually connect on STUN alone, so you can leave the Metered variables unset while developing. Across NATs, relay credentials become necessary — `/api/turn-credentials` returns a 500 without them and the client falls back to Google's public STUN servers.

## Environment variables

**`server/.env`**

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | — | PostgreSQL connection string |
| `JWT_SECRET` | yes | — | Signing secret for session tokens |
| `JWT_EXPIRES_IN` | yes | — | Token lifetime, e.g. `7d` |
| `CLIENT_ORIGIN` | no | `http://localhost:5173` | Allowed CORS origin and OAuth redirect target |
| `PORT` | no | `3000` | HTTP port |
| `NODE_ENV` | no | — | `production` switches cookies to `Secure` and `SameSite=None` |
| `GOOGLE_CLIENT_ID` | no | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | no | — | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | no | — | Must match the redirect URI registered with Google |
| `METERED_DOMAIN` | no | — | Metered subdomain used to fetch TURN credentials |
| `METERED_API_KEY` | no | — | Metered API key |

**`client/.env`**

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `VITE_API_BASE` | no | `http://localhost:3000` | Base URL for REST calls and the Socket.IO connection |

## Playground controls

| Input | Action |
| --- | --- |
| `W` `A` `S` `D` | Move |
| Mouse | Look around — click the canvas to capture the pointer |
| `E` | Interact: sit on a couch seat, or stand back up |
| `Q` | Toggle first-person / third-person camera |
| `1` `2` `3` | Wave / Point / Thumbs up |
| `0` | Cancel the current gesture |
| `P` | Leave the playground, back to the video grid |

## API reference

Routes marked with a lock require the `token` cookie.

**Auth** — mounted at `/api/auth`

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/register` | Create an account with name, email and password |
| `POST` | `/login` | Sign in, sets the JWT cookie |
| `POST` | `/logout` | 🔒 Clear the session cookie |
| `GET` | `/me` | 🔒 Current user |
| `GET` | `/auth/google` | Start the Google OAuth flow *(root level)* |
| `GET` | `/auth/google/callback` | OAuth callback, redirects to `/home` *(root level)* |

**Meetings** — mounted at `/api/meetings`

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/instant` | 🔒 Create a meeting that starts immediately |
| `POST` | `/join` | 🔒 Join by room code, registers you as a participant |
| `POST` | `/schedule` | 🔒 Create a meeting for a future time |
| `GET` | `/recent` | 🔒 Meetings you have been in |
| `GET` | `/scheduled` | 🔒 Your upcoming meetings |

**Misc**

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/turn-credentials` | Proxy for the Metered ICE server list |

### Socket.IO events

Authentication happens in a handshake middleware that reads the `token` cookie, an unauthenticated socket is rejected before any event fires.

**Meeting signalling**

| Direction | Event | Payload |
| --- | --- | --- |
| client to server | `join-room` | `roomCode` |
| client to server | `offer` / `answer` | `{ to, offer }` / `{ to, answer }` |
| client to server | `ice-candidate` | `{ to, candidate }` |
| client to server | `screen-share-started` | `{ to, streamId }` — `to` omitted broadcasts to the room |
| client to server | `screen-share-stopped` | — |
| server to client | `meeting-info` | `{ startedAt, localName }` |
| server to client | `user-joined` | `{ id, name }` |
| server to client | `offer` / `answer` | `{ from, offer, name }` / `{ from, answer, name }` |
| server to client | `ice-candidate` | `{ from, candidate }` |
| server to client | `screen-share-started` | `{ from, streamId }` — tells the receiver which incoming stream is a screen, not a camera |
| server to client | `screen-share-stopped` | `{ from }` |
| server to client | `user-left` | `socketId` |
| server to client | `error` | message string |

**Playground**

| Direction | Event | Payload |
| --- | --- | --- |
| client to server | `join-game` / `leave-game` | `{ roomCode }` |
| client to server | `game-player-update` | `{ roomCode, position, rotation, state, animation }` — `rotation` is `{ y, headYaw, headPitch }` |
| client to server | `request-sit` / `leave-seat` | `{ roomCode, seatId }` |
| client to server | `game-gesture` | `{ roomCode, gesture }` |
| server to client | `game-state` | `{ players, couchSeats }` — sent on join |
| server to client | `game-user-joined` / `game-user-left` | `{ id, name }` |
| server to client | `game-player-update` | `{ id, position, rotation, state, animation }` |
| server to client | `player-sat` / `player-stood` | `{ id, seatId }` |
| server to client | `seat-occupied` | `{ seatId }` |
| server to client | `game-room-full` | — |

## Project structure

```
Hangout/
├── client/                        # React + Vite front end
│   ├── public/playground/assets/  # Avatar .glb models and animations
│   └── src/
│       ├── features/meeting/      # VideoGrid, ControlBar, PlaygroundView, panels
│       ├── layouts/               # MainLayout, MeetingLayout
│       ├── pages/                 # Landing, Login, Register, Home, Meeting, Game
│       ├── playground/            # The 3D world
│       │   ├── game/index.js      # Scene, lighting, room geometry, render loop
│       │   ├── player.js          # Local avatar: input, camera rig, collision, face screen
│       │   ├── remotePlayers.js   # Remote avatars: spawning, interpolation, face screens
│       │   └── network.js         # Playground socket layer
│       └── routes/                # Route table and auth guards
│
└── server/                        # Express + Socket.IO API
    ├── prisma/                    # Schema and migrations
    └── src/
        ├── config/                # socket.js (signalling + game rooms), passport.js
        ├── middleware/            # JWT auth guard
        └── modules/               # auth, meeting, user — routes / controller / service
```

### Data model

Four Prisma models: `User`, `Meeting`, `Participant` and `Message`. A meeting has one host and many participants; room codes are unique and collision-checked at creation time.

## Deployment

The client builds to static files and deploys to any static host, a `client/vercel.json` is included for Vercel. The server needs a Node runtime with WebSocket support; its `build` script runs `prisma generate` and `npm start` boots the HTTP and Socket.IO server.

In production set `NODE_ENV=production` so auth cookies are issued with `Secure` and `SameSite=None`, and point `CLIENT_ORIGIN` at the deployed front end — it drives both the CORS allow-list and the post-OAuth redirect.

## Known gaps

- The playground caps at **3 concurrent avatars** per room, though the video call itself has no limit.
- Mesh topology means every peer holds a connection to every other peer, so upstream bandwidth grows linearly with participants. Fine for small groups; an SFU would be the next step.
- A `Message` model exists in the schema, but in-meeting chat is not wired up yet.
- The "Raise Hand" control is rendered but not yet functional.
- Meeting `endedAt` is never written, so meetings stay `ongoing` after everyone leaves.

## License

meh
