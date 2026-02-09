# [Project Name] — WebSocket Demo ([Client] + [Server])

A small, production-leaning WebSocket project that demonstrates:

- authenticated connection setup
- subscription / room-style messaging
- reconnect + backoff handling
- message validation and predictable state updates
- basic observability (connection health, retries, last-message timestamps)

> This is intentionally focused on maintainable structure and correctness, not UI polish.

---

## Tech Stack

- Node: [20+]
- Package manager: [pnpm / npm]
- WebSocket: [ws / socket.io / native]
- Client: [React + TS / plain TS]
- Server: [Express / Fastify / bare Node]
- Lint/format: ESLint + Prettier
- Tests: [Vitest/Jest]

---

## Getting Started

### Prerequisites

- Node [20+]
- [pnpm 9+] (recommended)

### Install

```bash
pnpm install

pnpm dev
```
