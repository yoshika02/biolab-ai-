# Biolab AI

A comprehensive AI-powered platform for biological research labs, featuring protocol assistance, paper summarization, inventory tracking, experiment logging, primer design, chemical safety, and analytics.

## Project Structure

```
biolab-ai/          # Next.js frontend
backend/            # Cloudflare Workers backend
```

## Build Strategy & Workflow

### Phase 1: Foundation (M0) ✅ Complete
- **Auth + Dashboard Shell**: User login/registration with role-based access (researcher, lab head, admin)
- **Sidebar Navigation**: Links to all 6 modules
- **PostgreSQL Schema**: Users, experiments, inventory, logs
- **Home Dashboard**: Activity feed, quick-access cards
- **Tech Stack**: Next.js, PostgreSQL, JWT auth, Tailwind CSS

### Phase 2: Research Modules (Weeks 4-7)

#### M1: Protocol Assistant 🔄 Next Priority
- Upload lab SOPs, protocol PDFs, manuals
- RAG pipeline: chunk, embed, store in pgvector
- Chat interface: ask questions, get cited answers
- Step-by-step protocol viewer with checkboxes
- Protocol version history and diff viewer
- **Tech**: LangChain, pgvector, Anthropic API, PDF parsing

#### M2: Paper Summarizer
- Input: DOI, PubMed ID, or PDF upload
- AI output: 5-line summary, key findings, methodology, limitations
- Research gap identifier
- Suggested next experiments
- Literature library: save, tag, search
- Auto-link papers to experiments
- **Tech**: PubMed API, Anthropic API, PDF upload

### Phase 3: Lab Operations Modules

#### M3: Inventory Tracker
- Add reagents, chemicals, kits (quantity, location, expiry)
- AI reorder prediction
- Expiry alerts (dashboard + email)
- Usage log with experiment linking
- Incompatible chemical storage flags
- CSV import for existing sheets
- **Tech**: PostgreSQL, Python ML, Cron jobs

#### M4: Experiment Logger
- Create experiment entries (type, date, protocol, team)
- Daily result logging (OD600, pH, yield, notes)
- AI anomaly detector
- Auto-weekly AI summaries
- Attach images/CSV data
- Export PDF lab reports
- **Tech**: XGBoost, Anthropic API, PostgreSQL

### Phase 4: Specialist Tools

#### M5: Primer Designer
- Input: gene sequence or FASTA
- Auto-compute Tm, GC%, amplicon size, secondary structures
- Rank primer pairs by quality score
- AI explanations
- Off-target check via BLAST API
- Save to experiment records
- **Tech**: Biopython, BLAST API, Anthropic API

#### M6: Chemical Safety Chatbot
- Safety questions: "Is it safe to mix X and Y?"
- Pull SDS from PubChem API
- Hazard classification (GHS symbols, H-statements)
- Inventory-aware warnings
- Emergency response guides
- Exportable risk register
- **Tech**: PubChem API, Anthropic API, RAG

### Phase 5: Analytics & Reporting

#### M7: Unified Analytics Dashboard
- Cross-module overview (experiments, inventory, alerts)
- Experiment trend charts
- Reagent burn-down charts
- AI weekly digest
- Export full lab reports as PDF
- Power BI/Tableau embed option
- **Tech**: Recharts, Power BI, Anthropic API

## Development Workflow

1. **Local Development**
   ```bash
   # Frontend
   cd biolab-ai
   npm install
   npm run dev

   # Backend
   cd backend
   npx wrangler dev
   ```

2. **Database Management**
   ```bash
   # Create migrations
   npx prisma migrate dev

   # Seed database
   npm run db:seed

   # D1 operations
   npx wrangler d1 execute biolab-db --file=./schema.sql
   ```

3. **Deployment**
   - Frontend: Cloudflare Pages
   - Backend: Cloudflare Workers
   - Database: Cloudflare D1

## Deployment Guide

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Cloudflare Workers, Hono.js
- **Database**: PostgreSQL (local), Cloudflare D1 (production)
- **Auth**: JWT, bcrypt
- **AI**: Anthropic API, LangChain
- **Deployment**: Cloudflare Pages, Cloudflare Workers

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install` in both `biolab-ai/` and `backend/`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `npm run db:migrate`
5. Start development servers: `npm run dev` (frontend) and `npx wrangler dev` (backend)

## Contributing

Follow the build order above. Each module should be developed as a separate feature branch and tested thoroughly before merging.