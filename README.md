# Cloudflare-native DNS Doctor

This application performs comprehensive DNS analysis, provides recommendations, and stores diagnostic history using Cloudflare's Infrastructure.

Built w/ [Cloudflare Workers](https://workers.cloudflare.com/), [Workers AI](https://developers.cloudflare.com/workers-ai/), [Durable Objects](https://developers.cloudflare.com/durable-objects/), and [Pages](https://developers.cloudflare.com/pages/).

![Architecture Diagram](./assets/architecture.png)

## Features

- **Comprehensive DNS Analysis**: Queries multiple DNS record types (A, AAAA, CNAME, MX, NS, TXT, SOA, CAA)
- **Multi-Resolver Propagation Checks**: Verifies DNS propagation across Cloudflare, Google, and Quad9 resolvers
- **Rule-Based Diagnostics**: Detects common DNS misconfigurations:
  - NS record mismatches
  - CNAME at apex violations
  - Missing AAAA records
  - Email setup issues (MX, SPF, DMARC)
  - SPF syntax errors
  - TTL optimization issues
- **LLM Analysis**: Uses Llama 3.3 on Workers AI (with OpenAI fallback) to provide expert explanations and fix recommendations
- **History Tracking**: Stores diagnostic results in Durable Objects for quick access to previous analyses
- **Modern UI**: Clean, Cloudflare-inspired React interface with Tailwind CSS

## Project Structure

```
cf_ai_dns_doctor/
├── worker/                 # Cloudflare Worker
│   ├── src/
│   │   ├── index.ts        # Main router
│   │   ├── dns.ts          # DNS-over-HTTPS queries
│   │   ├── diagnose.ts     # Rule-based analysis
│   │   ├── ai.ts           # AI analysis layer
│   │   ├── durable.ts      # Durable Object class
│   │   ├── types.ts        # TypeScript types
│   │   └── constants.ts   # Constants
│   ├── wrangler.toml       # Worker configuration
│   └── package.json
├── frontend/               # React Vite frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.tsx         # Main app component
│   │   ├── api.ts          # API client
│   │   └── types.ts        # TS types
│   ├── package.json
│   └── vite.config.ts
├── README.md
└── PROMPTS.md
```

## API Endpoints

### GET `/api/dns?domain=example.com`

Performs comprehensive DNS diagnostics for a domain.

**Response:**

```json
{
  "domain": "example.com",
  "dnsResults": { ... },
  "diagnostics": {
    "issues": [ ... ],
    "summary": {
      "errors": 0,
      "warnings": 2,
      "info": 1
    }
  },
  "aiExplanation": {
    "summary": "...",
    "issues": [ ... ]
  },
  "timestamp": 1234567890
}
```

### GET `/api/dns/history?domain=example.com`

Retrieves diagnostic history for a domain.

**Response:**

```json
{
  "domain": "example.com",
  "history": [ ... ]
}
```

### POST `/api/dns/store`

Stores diagnostic results (called internally by the worker).

## Technologies Used

- **Cloudflare Workers**: Serverless runtime for DNS queries and analysis
- **Workers AI**: Llama 3.3 for AI-powered DNS analysis
- **Durable Objects**: Persistent storage for diagnostic history
- **Cloudflare Pages**: Frontend hosting
- **React**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Vite**: Build tool
- **React Query**: Data fetching and caching

## Author

Built by Luan Nguyen for Cloudflare job application submission.
