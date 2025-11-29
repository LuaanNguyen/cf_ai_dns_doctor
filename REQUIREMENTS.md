# Full Project Requirements

## Cloudflare Worker API `/api/dns?domain=example.com`

Implement the Worker in `worker/src/index.ts`

It should:

- Accept `?domain=`
- Validate the domain format
- Call DNS-over-HTTPS using Cloudflare 1.1.1.1 with `Accept: application/dns-json`
- Query these record types: `A`, `AAAA`, `CNAME`, `MX`, `NS`, `TXT`, `SOA`, `CAA`
- Perform a multi resolver propagation check with:
  - Cloudflare 1.1.1.1
  - Google 8.8.8.8
  - Quad 9.9.9.9
  - OpenDNS Resolver (If possible)
- Perform rule based analysis in diagnose.ts:
  - NS mismatch
  - CNAME at apex detection
  - Missing AAAA
  - Missing MX or TXT for email setups
  - SPF syntax problems
  - TTL too high or too low
  - DNSSEC status flags
- Save results in a Durable Object called `DomainHistory`
- pass all results to a AI intepretation layer

## Durable Object:

In `worker/src/durable.ts`

It should store:

- Domain
- raw diagnostic JSON
- ai explanatin JSON
- timestamp

Expose endpoints:

- POST: `/store`
- GET: `/history?domain=`

Bind in `wrangler.toml`

## LLM Analysis Layer (Doctor)

In `worker/src/ai.ts`

Use Llama 3.3 on Workers AI, or OpenAI API

System prompt:

```
"You are a DNS expert. You take DNS diagnostic JSON and explain misconfigurations, why they matter, severity rating from 1 to 10, and list exact steps to fix each problem."
```

Return structured explanation text.

## Frontend

Inside `frontend` create a Vite React App + TS, React Query (Optional). Try to Replicate Cloudflare's latest UI design

App Requirements:

- A search bar to input domains
- Button to trigger diagnostics
- Loading indicator

Results page with:

- DiagnosticsPanel
- RawResults
- AiExplanation
- Sidebar showing query history loaded from the Durable Object
- Collapsible sections
- Clean Tailwind styling

Component details:

- `DomainSearch.tsx`: Input box + submit handler + Tailwind UI.

- `DiagnosticsPanel.tsx` Show record types with color coding:

  - green for OK
  - yellow for warnings
  - red for errors

- `RawResults.tsx`: Pretty JSON viewer using `<pre>` with Tailwind.

- `AiExplanation.tsx`: AI generated explanation with: Severity badges, Step by
  step recommended fixes

- `HistorySidebar.tsx`: Shows recent lookups stored in DO.

## Coding style

Please use clean modular TypeScript with comments describing logic, no hardcoded values and ensure CORS is enabled for frontend calls

documentations should be in `README.md` for now.

**IMPORTANT:** Record all prompts I used during development in `PROMPTS.md`, add a place holder for additional entries like comments.
