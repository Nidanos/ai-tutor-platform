# AI Tutor Platform — Evidence-Based Learning System

An intelligent, adaptive learning platform engineered around **deliberate scaffolding withdrawal**: providing structured assistance when a learner struggles and systematically fading support as mastery increases until the learner can construct solutions independently.

---

## 🏗️ Monorepo Workspace Structure

```text
ai-tutor-platform/
├── apps/
│   ├── api/          # Node.js + Express + TypeScript Backend (Modules M1–M13)
│   └── web/          # Next.js Frontend with Monaco Code Editor
├── packages/
│   ├── types/        # Shared TypeScript DTOs & API Contracts (@ai-tutor/types)
│   └── config/       # Shared tooling configurations
├── docker-compose.yml# Local PostgreSQL (+pgvector) and Redis infrastructure
└── pnpm-workspace.yaml
```

---

## 🛠️ Tech Stack & Infrastructure

- **Frontend:** Next.js (React), TypeScript, Monaco Editor
- **Backend:** Node.js, Express, TypeScript (Clean Architecture)
- **Database:** PostgreSQL with `pgvector` (Skill DAG & Vector Embeddings)
- **Queue & Cache:** Redis + BullMQ (Asynchronous Generation & Sandbox Execution)
- **Execution Environment:** E2B sandbox (network off) + our own judge adapter; exercises in C++20 on clang 19 (see `DOCS/adr/`)
- **v1 Domain:** Data Structures & Algorithms

---

## 🚀 Quickstart for Developers

### Prerequisites

- Node.js v22+ (see `.nvmrc`)
- `pnpm` (`npm install -g pnpm`)
- Docker Desktop (for local PostgreSQL & Redis)

### Installation & Local Setup

```text
# 0. Create env files from the examples, then set real passwords
cp .env.example .env
cp apps/api/.env.example apps/api/.env

# 1. Install all monorepo dependencies
pnpm install

# 2. Spin up local PostgreSQL and Redis containers
pnpm db:up   # = docker compose up -d

# 3. Create the tables, then load the starter data (seed is safe to re-run)
pnpm --filter @ai-tutor/api db:migrate
pnpm --filter @ai-tutor/api db:seed

# 4. Start development servers across apps (API :3001, web :3000)
pnpm dev
```
