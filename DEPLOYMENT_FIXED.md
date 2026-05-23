# BioLab AI - Deployment Guide (Fixed)

## Prerequisites
- Cloudflare account with API token
- Node.js 20+
- wrangler CLI installed

## Quick Deployment Steps

### 1. Setup Environment Variables

Create `.env.local` in the biolab-ai directory:
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
DATABASE_URL=file:./dev.db
```

### 2. Deploy to Cloudflare Pages (Recommended)

The easiest way is through GitHub integration:

1. Go to Cloudflare Dashboard > Pages
2. Click "Create application" > "Connect to Git"
3. Select the biolab-ai repository
4. Set build command: `npm run build`
5. Set output directory: `.next`
6. Add environment variables in Pages settings:
   - `ANTHROPIC_API_KEY=your_key`

### 3. Deploy with Wrangler (Direct)

If deploying directly with wrangler:

```bash
cd biolab-ai

# Authenticate
wrangler auth login

# Deploy to Cloudflare Pages Functions
wrangler deploy

# Or use this for Pages:
wrangler pages deploy .next/standalone --project-name biolab-ai
```

### 4. Configure Secrets in Cloudflare

Set the ANTHROPIC_API_KEY secret:
```bash
wrangler secret put ANTHROPIC_API_KEY
# Enter your API key when prompted
```

### 5. Database Setup

The app uses Cloudflare D1. The database is already configured in `wrangler.toml`:
- Database Name: `biolab-db`
- Database ID: `368913a3-0003-4431-b19c-75c28655d08b`

Run migrations:
```bash
npm run db:migrate
```

## Build Status

✅ **Build Fixed:**
- Fixed TypeScript config (moduleResolution: nodenext)
- Added @anthropic-ai/sdk to dependencies
- Build artifact at `.next/` directory

## Troubleshooting

**Issue:** Build fails with "moduleResolution" error
**Solution:** Already fixed in `tsconfig.json` (line 11)

**Issue:** Module not found errors
**Solution:** Run `npm install` to ensure all dependencies installed

**Issue:** Anthropic API errors at runtime
**Solution:** Set `ANTHROPIC_API_KEY` in Cloudflare environment variables

## Next Steps

1. Add your Cloudflare domain to the Pages project
2. Test the Protocol AI feature at `/dashboard/protocol`
3. Configure custom domain in Cloudflare
4. Setup CI/CD for automatic deployments on push

## Support

For issues, check:
- Cloudflare Workers logs: `wrangler tail`
- Build logs: Check the `.next` directory
- Type errors: Run `npx tsc --noEmit` to check TypeScript
