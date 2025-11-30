# Prompts Used During Development

This file documents all AI prompts used during the development of this project

## Project Setup

### Initial Planning

**Prompt:**

```
I am applying for an internship at Cloudflare and there is an assignment to build an AI-powered application on Cloudflare. Below is the requirements:

- LLM (recommend using Llama 3.3 on Workers AI), or an external LLM of your choice
- Workflow / coordination (recommend using Workflows, Workers or Durable Objects)
- User input via chat or voice (recommend using Pages or Realtime)
- Memory or state

Let me know if this is possible, I will proceed to give you an idea I have and we can go from there.
```

**Context:** Project Motivation

**Result:** Initial Context for ChatGPT to understand the expectations of the project.

---

**Prompt:**

```
I want to build an AI-powered application on Cloudflare. Think of it like a DNS doctor that performs DNS diagnostics using Cloudflare DoH, analyzes the results with Llama 3.3 on Workers AI, stores history using Durable Objects, and provides a clean React UI deployed on Cloudflare pages.

I've written requirements in @REQUIREMENTS.md. Let's plan this out and give any additional comments about my idea.
```

**Context:** Initial project planning and architecture discussion.

**Result:** Comprehensive implementation plan created with project structure and step-by-step implementation guide.

---

## Implementation Prompts

### DNS Query Implementation

**Prompt:**

```
Implement DNS-over-HTTPS querying module with multi-resolver propagation checks.

Make sure it supports Cloudflare 1.1.1.1, Google 8.8.8.8, Quad9 9.9.9.9 resolvers. Query A, AAAA, CNAME, MX, NS, TXT, SOA, CAA record types.
```

**Context:** Needed to implement the core DNS querying functionality.

**Result:** Created `dns.ts` with functions for querying DNS records via DoH and checking propagation across multiple resolvers.

---

### Rule-Based Analysis

**Prompt:**

```
Create rule-based analysis module that checks for: NS mismatch, CNAME at apex detection, missing AAAA, missing MX/TXT for email, SPF syntax problems, TTL too high/low, DNSSEC status, etc.

Return structured diagnostic JSON with severity levels to so I can display on the frontend.
```

**Context:** Required comprehensive DNS diagnostic checks.

**Result:** Implemented `diagnose.ts` with all requested checks and structured diagnostic output.

---

### AI Analysis Layer

**Prompt:**

```
Build AI analysis layer using Workers AI (Llama 3.3) and use ChatGPT as a fallback.

System prompt: "You are a DNS expert. You take DNS diagnostic JSON and explain misconfigurations, why they matter, severity rating from 1 to 10, and list exact steps to fix each problem."

Return structured explanation with issues, severity, explanations, and fix steps.
```

**Context:** Needed AI-powered analysis of DNS diagnostics.

**Result:** Created `ai.ts` with Workers AI integration and OpenAI fallback, including structured prompt and response parsing.

---

### Durable Object Implementation

**Prompt:**

```
Create Durable Object class for storing domain diagnostic history. Store domain, raw diagnostic JSON, AI explanation JSON, and timestamp.

Expose POST /store and GET /history?domain= endpoints.
```

**Context:** Required persistent storage for diagnostic history.

**Result:** Implemented `durable.ts` with DomainHistory class supporting storage and retrieval of diagnostic results.

---

### Frontend Components

**Prompt:**

```
Create these following React components:
- DomainSearch (for URL input + submit)
- DiagnosticsPanel (color-coded record display)
- RawResults (JSON viewer wtih copy and paste)
- AiExplanation (severity badges + fix steps)
- HistorySidebar (recent lookups)

Use Tailwind CSS with Cloudflare-inspired design.
```

**Context:** Needed complete frontend UI components.

**Result:** Created all required React components with Tailwind styling and Cloudflare-inspired design.

---

## DNS Understanding & Research

### DNS Record Types and Structure

**Prompt:**

```
Explain DNS record types: A, AAAA, CNAME, MX, NS, TXT, SOA, and CAA. What is the purpose of each, what data do they contain, and what are common misconfigurations for each type?
```

**Context:** Needed to understand DNS record types before implementing diagnostics.

**Result:** Gained understanding of each record type, their purposes, and common issues (e.g., CNAME at apex violation, missing AAAA for IPv6 readiness).

---

### DNS-over-HTTPS (DoH) Protocol

**Prompt:**

```
How does DNS-over-HTTPS (DoH) work? What's the API format for Cloudflare 1.1.1.1, Google 8.8.8.8, and Quad9 resolvers? Show me example requests and responses.
```

**Context:** Required to implement DNS queries via DoH.

**Result:** Learned DoH uses GET requests with query parameters, Accept: application/dns-json header, and returns JSON-formatted DNS responses.

---

### DNS Propagation and Multi-Resolver Checks

**Prompt:**

```
What does DNS propagation mean? Why would different DNS resolvers return different results for the same domain? How can I check if DNS changes have propagated across multiple resolvers?
```

**Context:** Needed to implement propagation checks across multiple resolvers.

**Result:** Understood that DNS propagation involves caching and TTL, and different resolvers may have different cached results. Implemented multi-resolver checks to detect inconsistencies.

---

### SPF Record Syntax Validation

**Prompt:**

```
What is SPF (Sender Policy Framework)? What's the correct syntax for SPF records? What are common SPF syntax errors that I should validate?
```

**Context:** Required to implement SPF syntax validation in diagnostics.

**Result:** Learned SPF records start with "v=spf1", use mechanisms like "include", "a", "mx", "ip4", "ip6", and common errors include invalid mechanisms and syntax issues.

---

### CNAME at Apex Violation

**Prompt:**

```
Why is having a CNAME record at the apex (root domain) a problem? What does RFC 1034 say about this? What are the alternatives?
```

**Context:** Needed to understand why CNAME at apex is an error.

**Result:** Learned that RFC 1034 prohibits CNAME at apex because apex can only have one record type. Alternatives include using A/AAAA records or ALIAS/ANAME records (non-standard).

---

### TTL Best Practices

**Prompt:**

```
What are DNS TTL (Time To Live) best practices? What TTL values are too low (causing excessive queries) and too high (causing slow propagation)? What are recommended TTL ranges?
```

**Context:** Required to implement TTL analysis in diagnostics.

**Result:** I learned that TTL < 300s causes excessive queries, TTL > 86400s causes slow propagation. Recommended range is 300-86400 seconds (5 minutes to 24 hours).

---

## API Design & Architecture

### RESTful API Design for DNS Diagnostics

**Prompt:**

```
Design a RESTful API for a DNS diagnostic service. What endpoints should I have? How should I structure the request/response format? Should I use query parameters or request body?
```

**Context:** Needed to design the API structure before implementation.

**Result:** Designed GET /api/dns?domain= for diagnostics, GET /api/dns/history?domain= for history, POST /api/dns/store for storing results. Used query parameters for GET requests, JSON body for POST.

---

### CORS Configuration for Cloudflare Workers

**Prompt:**

```
How do I enable CORS in Cloudflare Workers? What headers do I need to set? Should I handle OPTIONS preflight requests?
```

**Context:** Frontend on Pages needs to call Worker API, requiring CORS.

**Result:** Implemented CORS headers (Access-Control-Allow-Origin, -Methods, -Headers) and OPTIONS handler for preflight requests.

---

### Error Handling Patterns

**Prompt:**

```
What are best practices for error handling in Cloudflare Workers? How should I structure error responses? What HTTP status codes should I use for different error types?
```

**Context:** Needed to implement proper error handling throughout the worker.

**Result:** Used 400 for bad requests (invalid domain), 404 for not found, 500 for server errors. Structured error responses with error message and details.

---

### Durable Objects API Design

**Prompt:**

```
How do I design the API for a Durable Object? Should I use the fetch() method pattern? How do I route different endpoints within a Durable Object?
```

**Context:** Needed to implement Durable Object with multiple endpoints (store, history).

**Result:** Used fetch() method pattern, parsed URL pathname to route to different handlers (POST /store, GET /history).

---

## Cloudflare-Specific Questions

### Workers AI Integration

**Prompt:**

```
How do I use Workers AI with Llama 3.3 in Cloudflare Workers and what's the API format? How do I configure the binding in wrangler.toml?
```

**Context:** Needed to integrate Workers AI for DNS analysis.

**Result:** Learned to use env.AI.run() with model name '@cf/meta/llama-3.3-70b-instruct-fp8-fast', configured [ai] binding in wrangler.toml.

---

### Durable Objects Configuration

**Prompt:**

```
How do I configure Durable Objects in wrangler.toml? What's the difference between bindings and migrations? Do I need migrations for first-time deployment?
```

**Context:** Required to set up Durable Objects for history storage.

**Result:** Configured [[durable_objects.bindings]] for runtime binding, [[migrations]] for first deployment with new_classes array.

---

### Environment Variables and Secrets

**Prompt:**

```
What's the difference between [vars] and secrets in Cloudflare Workers? How do I set secrets using wrangler? When should I use secrets vs environment variables?
```

**Context:** Needed to configure OpenAI API key as optional fallback.

**Result:** Used wrangler secret put for sensitive data (API keys), [vars] for non-sensitive configuration.

---

## Frontend & UI Design

### TypeScript Type Sharing

**Prompt:**

```
How can I share TypeScript types between my Cloudflare Worker and React frontend? Should I create a shared types package or duplicate the types?
```

**Context:** Needed type definitions for API responses in both worker and frontend.

**Result:** Created separate types.ts files in both projects with matching interfaces, ensuring type safety across the stack.

## Comments

Thes are all the prompts I used to guide the implementation of this project.These prompts helped me build understanding of DNS protocols, API design patterns, and Cloudflare platform.

## Other Sources

- https://www.youtube.com/watch?v=yp1rH7Kj12o
- https://www.cscdbs.com/blog/why-dns-has-become-the-biggest-single-point-of-failure/
- https://www.youtube.com/shorts/BRQqDnu_1jY
