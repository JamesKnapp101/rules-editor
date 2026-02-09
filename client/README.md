# Rule Editor — WebSocket Demo (Client + Server)

A small, production-leaning WebSocket project that demonstrates:

- authenticated connection setup
- subscription / room-style messaging
- reconnect + backoff handling
- message validation and predictable state updates
- basic observability (connection health, retries, last-message timestamps)

> This project prioritizes structure, correctness, and maintainability over UI polish.

---

## Tech Stack

- **Node**: 20+
- **Package manager**: npm
- **WebSocket**: `ws`
- **Client**: React + TypeScript (Vite)
- **Server**: Bare Node + TypeScript
- **Dev runtime**: `tsx`
- **Linting**: ESLint (flat config, v9)
- **Testing**: Vitest (server)

---

## Project Structure

rules-editor/
├─ client/ # React + Vite frontend
├─ server/ # WebSocket server
├─ package.json # Root orchestration scripts
└─ README.md

- The **server** is a standalone WebSocket service.
- The **client** manages connection lifecycle, subscriptions, and UI state.
- Root scripts orchestrate install, dev, lint, test, and build across both.

---

## Getting Started

### Prerequisites

- Node 20+
- npm (comes with Node)

> An `.nvmrc` is provided for convenience.

---

### Install

Install dependencies for both client and server:

```bash
npm run install:all
```

### Run

npm run dev

### Lint

npm run lint

### Tests

npm test

### Build

Builds both server and client:

npm run build

Server output: server/dist/
Client output: client/dist/

### Preview

npm run preview

## Configuration

The project is intentionally minimal and runs out of the box.

If environment variables are added later, they should be documented via a
`.env.example` file and never committed directly.

---

## Design Notes

- WebSocket lifecycle logic is centralized rather than scattered across components.
- Message types are explicitly modeled with TypeScript unions.
- Client state updates are predictable and scoped.
- Reconnect logic uses bounded retries and backoff.
- Lint rules are strict enough to catch real issues, not stylistic noise.

---

## What This Is (and Isn’t)

### This is:

- a realistic WebSocket architecture example
- a reference for clean client/server separation
- suitable as a technical demo or interview artifact

### This is not:

- a polished product UI
- a full auth system
- a backend framework showcase
