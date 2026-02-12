# Rule Editor — Production-Style WebSocket Reference

**Client + Server · React · TypeScript · WebSockets**

A production-oriented reference implementation of a real-time collaborative feature built on WebSockets.

This project focuses on **architecture, correctness, and long-term maintainability** — the parts that usually break down first in real systems — rather than UI polish.

It demonstrates how to structure a long-lived, team-owned WebSocket feature without letting connection logic, state updates, and reconnection behavior sprawl across the codebase.

---

## Screenshot

![Rule Editor activity feed](client/src/assets/screenshot.png)

---

## What This Demonstrates

Core engineering concerns you encounter in real production WebSocket systems:

- Authenticated connection setup
- Room / subscription-based messaging
- Centralized connection lifecycle management
- Deterministic client-side state updates
- Reconnect handling with bounded retries + backoff
- Explicit, typed message contracts shared across client/server
- Basic observability (connection state, retries, last-message timestamps)
- Clean separation of concerns between transport, channels, and UI

---

## Architecture

### Client

- Connection lifecycle manager
- Channel abstraction for feature isolation
- Typed message handling
- Predictable state updates
- Reconnect + backoff logic
- Minimal UI to visualize activity

### Server

- Room-based subscriptions
- Message validation
- Presence tracking
- Broadcast fan-out
- Explicit protocol contracts

### Design Goals

- Avoid WebSocket logic scattered across components
- Make behavior easy to reason about and test
- Keep adding new real-time features cheap
- Favor clarity over cleverness

---

## Tech Stack

### Runtime & Tooling

- Node.js 20+
- npm workspaces
- TypeScript (shared contracts)
- `tsx` (server dev runtime)

### Client

- React
- TypeScript
- Vite

### Server

- Bare Node.js
- `ws`

### Quality

- ESLint (flat config, strict rules)
- Vitest (server tests)

---

## Project Structure

rules-editor/
├─ client/ # React + Vite frontend
├─ server/ # WebSocket server
├─ package.json # workspace orchestration
└─ README.md

- **Server** → message handling + validation
- **Client** → lifecycle, subscriptions, state
- **Shared types** → explicit protocol contracts

The goal is clean boundaries and low coupling.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

> `.nvmrc` included for convenience

### Install

```bash
npm run install:all
```

### Lint

npm run lint

### Tests

npm test

### Build

npm run build

## Preview

npm run preview

How to Try It

Open the app in two browser tabs

Enter different display names

Join the same room

Edit rules and observe activity + presence updates

Switch rooms to see live subscription changes
