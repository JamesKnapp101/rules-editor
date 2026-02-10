# Rule Editor — WebSocket Demo

**Client + Server · React · TypeScript · WebSockets**

A small, production-leaning WebSocket project that demonstrates how to design and structure a real-world, long-lived socket feature for teams that have to maintain it.

This repo intentionally favors **clarity, correctness, and extensibility** over UI polish.

---

## What This Project Demonstrates

- Authenticated WebSocket connection setup
- Room / subscription‑style messaging
- Predictable client‑side state updates
- Centralized connection lifecycle management
- Reconnect handling with bounded retries and backoff
- Explicit message validation using typed contracts
- Basic observability: connection state, retries, last‑message timestamps

---

![Rule Editor activity feed](client/src/assets/screenshot.png)

## Tech Stack

**Runtime & Tooling**

- Node.js 20+
- npm (workspace orchestration)
- TypeScript (shared contracts)
- `tsx` (server dev runtime)

**Client**

- React
- TypeScript
- Vite

**Server**

- Bare Node.js
- `ws`

**Quality & Safety**

- ESLint (flat config, v9)
- Vitest (server tests)

---

## Project Structure

```
rules-editor/
├─ client/        # React + Vite frontend
├─ server/        # WebSocket server
├─ package.json   # Root orchestration scripts
└─ README.md
```

- The **server** is a standalone WebSocket service with explicit message handling and validation.
- The **client** owns connection lifecycle, subscriptions, reconnection, and UI state.
- Root‑level scripts coordinate install, dev, lint, test, and build across both packages.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

> An `.nvmrc` file is included for convenience.

---

### Install

Install dependencies for both client and server:

```bash
npm run install:all
```

---

### Run (Development)

Start both client and server in watch mode:

```bash
npm run dev
```

---

### Lint

```bash
npm run lint
```

---

### Tests

```bash
npm test
```

---

### Build

Build both client and server:

```bash
npm run build
```

Outputs:

- Server: `server/dist/`
- Client: `client/dist/`

---

### Preview

Run the built client locally:

```bash
npm run preview
```

---

## Configuration

The project is intentionally minimal and runs out of the box.

If environment variables are introduced later:

- document them in a `.env.example` file
- never commit real values

---

## Design Notes

- WebSocket lifecycle logic is **centralized**, not scattered across components
- Message shapes are modeled explicitly with TypeScript unions
- Client state updates are deterministic and scoped
- Reconnect logic uses bounded retries with backoff
- Observability is treated as a first‑class concern
- Lint rules prioritize correctness and maintainability over stylistic bikeshedding

---

## How to Try It

1. Open the app in two browser tabs.
2. Enter different display names.
3. Join the same room.
4. Start editing a rule in one tab and observe activity updates in the other.
5. Switch rooms to see subscription changes and presence updates.

This is intentionally a minimal interaction surface; the focus is on WebSocket lifecycle, message flow, and state consistency rather than UI.

## What This Is (and Isn’t)

### This **is**:

- A realistic WebSocket architecture example
- A reference for clean client / server separation
- Suitable as a technical demo or interview artifact

### This **is not**:

- A polished product UI
- A full authentication system
- A backend framework showcase

---

## Why This Exists

This project exists to show what a calm, maintainable baseline looks like once you account for reconnection, state consistency, and long‑term ownership

## Limitations & Roadmap

- Concurrent editing is currently allowed (no edit locking).
- A scoped soft-lock per rule is a planned improvement:
  - Server-granted edit lease with TTL
  - Heartbeat refresh
  - Automatic expiration on disconnect
  - Client UI gating and lock visibility
