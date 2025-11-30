# Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account with Workers and Pages enabled
- Wrangler CLI installed globally: `npm install -g wrangler`

### Worker Setup

1. Navigate to the worker directory:

   ```bash
   cd worker
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Authenticate with Cloudflare:

   ```bash
   wrangler login
   ```

4. (Optional) Set OpenAI API key for fallback:

   ```bash
   wrangler secret put OPENAI_API_KEY
   ```

5. Deploy the worker:

   ```bash
   npm run deploy
   ```

   Or run locally:

   ```bash
   npm run dev
   ```

   The worker will be available at `http://localhost:8787` when running locally.

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file (optional, for local development):

   ```env
   VITE_API_URL=http://localhost:8787
   ```

   For production, set this to your deployed worker URL:

   ```env
   VITE_API_URL=https://dns-doctor.YOUR_SUBDOMAIN.workers.dev
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

### Deploy Frontend to Cloudflare Pages

1. Connect your repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set build output directory: `dist`
4. Set environment variable `VITE_API_URL` to your worker URL

Or use Wrangler:

```bash
cd frontend
npm run build
wrangler pages deploy dist
```

## Local Development

### Running Worker Locally

```bash
cd worker
npm run dev
```

The worker will be available at `http://localhost:8787`.

### Running Frontend Locally

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port Vite assigns).

Make sure to set `VITE_API_URL=http://localhost:8787` in your frontend `.env` file.

## Environment Variables

### Worker

- `OPENAI_API_KEY` (optional): OpenAI API key for AI analysis fallback

### Frontend

- `VITE_API_URL`: Base URL for the worker API (defaults to `http://localhost:8787`)

## Testing

To test the application:

1. Start the worker: `cd worker && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Open the frontend in your browser
4. Enter a domain name (e.g., `example.com`)
5. Click "Analyze DNS" and review the results
