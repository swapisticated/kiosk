# Kiosk

**The Intelligent Information Layer for Your Website.**

Kiosk is a multi-tenant, plug-and-play AI retrieval agent. It ingests your website's content, understands your business context, and embeds itself as a helpful, 24/7 knowledge concierge for your visitors.

Built on the edge with **Bun**, **Turso**, and **Hono**.

## Features

- **Zero-Config Knowledge Base** — Just drop a URL. Kiosk scrapes, chunks, and vectorizes your site automatically.
- **RAG-Powered Chat** — Answers questions using _only_ your content. No hallucinations.
- **Universal Embed** — A lightweight script tag that works on any site (React, HTML, WordPress, etc).
- **Enterprise Security** — Domain-restricted API keys and isolated tenant data spaces.
- **Edge Native** — Sub-millisecond cold starts and global low latency.

## Architecture

Kiosk uses a modern, edge-first stack designed for speed and scale:

- **Runtime:** [Bun](https://bun.sh) (Fast JavaScript runtime)
- **Framework:** [Hono](https://hono.dev) (Ultra-lightweight web standard)
- **Database:** [Turso](https://turso.tech) (Edge-replicated SQLite)
- **ORM:** [Drizzle](https://orm.drizzle.team) (Type-safe SQL)
- **Vectors:** [Pinecone](https://pinecone.io) (Serverless vector search)
- **LLM:** OpenAI GPT-4o-mini (Cost-effective intelligence)

## Project Structure

```bash
src/
├── db/             # Drizzle DTOs and Database connection
│   ├── schema.ts   # Database schema (Tenants, Documents, Chunks, etc.)
│   └── index.ts    # LibSQL client
├── routes/         # Hono API Routes
│   ├── tenants.ts  # Tenant onboarding & management
│   ├── ingest.ts   # Scraping & Vectorization pipeline
│   └── chat.ts     # RAG Inference endpoints
├── lib/            # Shared Utilities
│   ├── scraper.ts  # Cheerio/Playwright scraping logic
│   ├── chunker.ts  # Text splitting algorithms
│   └── ai.ts       # OpenAI & Pinecone wrappers
└── config/         # Environment configuration
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- A Turso Database
- An OpenAI API Key
- A Pinecone Index

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/kiosk.git
   cd kiosk
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Setup Environment**

   ```bash
   cp .env.example .env
   # Fill in your TURSO_*, OPENAI_*, and PINECONE_* keys
   ```

4. **Initialize Database**
   Push the schema to your Turso database:

   ```bash
   bun run drizzle-kit push
   ```

5. **Run Locally**
   ```bash
   bun run dev
   ```
   Server will start at `http://localhost:3000`.

## API Usage

### Create a Tenant

```bash
curl -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d '{"name": "My Shop", "email": "owner@myshop.com", "domain": "myshop.com"}'
```

_(More documentation coming soon)_

## License

MIT
