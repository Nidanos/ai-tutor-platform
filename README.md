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
│   ├── types/        # Shared TypeScript DTOs &amp; API Contracts (@ai-tutor/types)
│   └── config/       # Shared tooling configurations
├── docker-compose.yml# Local PostgreSQL (+pgvector) and Redis infrastructure
└── pnpm-workspace.yaml

```

---

## 🛠️ Tech Stack &amp; Infrastructure

- **Frontend:** Next.js (React), TypeScript, Monaco Editor
- **Backend:** Node.js, Express, TypeScript (Clean Architecture)
- **Database:** PostgreSQL with `pgvector` (Skill DAG &amp; Vector Embeddings)
- **Queue &amp; Cache:** Redis + BullMQ (Asynchronous Generation &amp; Sandbox Execution)
- **Execution Environment:** E2B sandbox (network off) + our own judge adapter; exercises in C++20 on clang 19 (see `DOCS/adr/`)
- **v1 Domain:** Data Structures & Algorithms

---

## 🚀 Quickstart for Developers

### Prerequisites

- Node.js v20+ LTS
- `pnpm` (`npm install -g pnpm`)
- Docker Desktop (for local PostgreSQL &amp; Redis)

### Installation &amp; Local Setup

```text
# 0. Create env files from the examples, then set real passwords
cp .env.example .env
cp apps/api/.env.example apps/api/.env

# 1. Install all monorepo dependencies
pnpm install

# 2. Spin up local PostgreSQL and Redis containers
pnpm db:up   # = docker compose up -d

# 3. Start development servers across apps
pnpm dev
```
