# Deployment Guide for Biolab AI

This guide covers deploying the Biolab AI platform to Cloudflare, including the Next.js frontend on Cloudflare Pages and the Cloudflare Workers backend with D1 database.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install globally
   ```bash
   npm install -g wrangler
   ```
3. **Cloudflare API Token**: Generate from Cloudflare Dashboard > My Profile > API Tokens
4. **Node.js**: Version 18+ installed

## Step 1: Authenticate Wrangler

```bash
wrangler auth login
```

Or set API token:
```bash
wrangler auth token <YOUR_API_TOKEN>
```

## Step 2: Configure Account ID

Update `backend/wrangler.toml`:
```toml
account_id = "YOUR_ACCOUNT_ID"  # Replace with your actual account ID
```

Get your account ID from Cloudflare Dashboard > Account Home.

## Step 3: Deploy D1 Database

Your D1 database is already created (`biolab-db`). If you need to recreate:

```bash
# Create new database
npx wrangler d1 create biolab-db

# Update wrangler.toml with the new database_id
```

## Step 4: Deploy Backend (Cloudflare Workers)

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies** (if any):
   ```bash
   npm install
   ```

3. **Deploy the worker**:
   ```bash
   npx wrangler deploy
   ```

4. **Note the deployed URL**: Something like `https://biolab-backend.your-subdomain.workers.dev`

## Step 5: Deploy Frontend (Cloudflare Pages)

1. **Navigate to frontend directory**:
   ```bash
   cd ../biolab-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the application**:
   ```bash
   npm run build
   ```

4. **Deploy to Cloudflare Pages**:
   ```bash
   npx wrangler pages deploy ./out --compatibility-date 2024-01-01
   ```

   Or connect to GitHub for automatic deployments:
   - Go to Cloudflare Dashboard > Pages
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set build output directory: `out`

## Step 6: Environment Variables

### Backend Environment Variables

Create/update `backend/wrangler.toml` with secrets:

```toml
[vars]
JWT_SECRET = "your-jwt-secret"
ANTHROPIC_API_KEY = "your-anthropic-key"
DATABASE_URL = "your-postgres-url"  # For local dev, use D1 in production
```

For secrets:
```bash
npx wrangler secret put JWT_SECRET
# Enter your secret when prompted
```

### Frontend Environment Variables

Create `.env.local` in `biolab-ai/`:
```
NEXT_PUBLIC_API_URL=https://biolab-backend.your-subdomain.workers.dev
NEXT_PUBLIC_ANTHROPIC_API_KEY=your-anthropic-key
DATABASE_URL=your-postgres-url
```

## Step 7: Database Migration

For production D1 database:

1. **Create migration file**:
   ```bash
   # In backend directory
   npx wrangler d1 execute biolab-db --file=../biolab-ai/prisma/migrations/your-migration/migration.sql
   ```

2. **Or use Prisma with D1**:
   Update `biolab-ai/prisma/schema.prisma` to use D1 adapter.

## Step 8: Update API Calls

Ensure frontend API calls point to the deployed backend URL:

```typescript
// In biolab-ai/lib/api.ts or similar
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
```

## Step 9: Testing Deployment

1. **Test backend health**:
   ```bash
   curl https://biolab-backend.your-subdomain.workers.dev/api/health
   ```

2. **Test frontend**: Visit your Pages URL

3. **Test database connection**: Ensure D1 bindings work in workers

## Step 10: Custom Domain (Optional)

1. **Add custom domain in Cloudflare Dashboard**
2. **Update DNS records**
3. **Configure SSL certificates**

## Troubleshooting

### Common Issues

1. **Wrangler auth fails**: Ensure API token has correct permissions
2. **D1 database not found**: Check database_id in wrangler.toml
3. **Build fails**: Ensure all dependencies are installed
4. **API calls fail**: Check CORS settings in worker

### Logs

- **Worker logs**: `npx wrangler tail`
- **Pages logs**: Cloudflare Dashboard > Pages > Your project > Logs

## CI/CD (Recommended)

Set up GitHub Actions for automatic deployments:

1. Add secrets to GitHub repo:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

2. Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy
   on:
     push:
       branches: [main]
   jobs:
     deploy-backend:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
         - run: npm install
         - run: npx wrangler deploy
           env:
             CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
             CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
   ```

## Cost Considerations

- **Cloudflare Workers**: Free tier includes 100,000 requests/day
- **Cloudflare Pages**: Free for personal projects
- **Cloudflare D1**: Free tier includes 500MB storage, 1 million row reads/month
- **Anthropic API**: Pay per token usage

## Security Notes

- Never commit secrets to version control
- Use Wrangler secrets for sensitive environment variables
- Enable Cloudflare's security features (WAF, Rate limiting)
- Regularly rotate API keys