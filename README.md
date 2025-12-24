# WealthAI Advisor

AI-powered Financial Advisor Workstation built on Vercel's Chat SDK with AI SDK 6.

## Features

### Core Capabilities
- **Multi-Model Support**: Claude, GPT, Gemini, Grok via Vercel AI Gateway
- **Streaming Responses**: Real-time streaming with resumable streams
- **Artifacts System**: Create documents, code snippets, and spreadsheets
- **Tool Calling**: AI can execute functions with human-in-the-loop approval
- **File Attachments**: Upload and analyze documents
- **Chat History**: Persistent conversation storage

### Financial Advisor Tools

| Tool | Description |
|------|-------------|
| `searchClients` | Search for clients by name, email, or account number |
| `getClientProfile` | Get detailed client information |
| `getPortfolioHoldings` | View current positions and values |
| `getPortfolioPerformance` | Returns vs benchmarks across time periods |
| `getAssetAllocation` | Target vs actual allocation with drift analysis |
| `getMarketQuote` | Current quotes for stocks and ETFs |
| `getMultipleQuotes` | Batch quote retrieval |
| `searchMarketNews` | Financial news filtered by symbols or topics |
| `getMarketOverview` | Major indices, sector performance, yields |
| `searchKnowledgeBase` | Firm policies, procedures, and best practices |
| `getKnowledgeBaseArticle` | Retrieve specific knowledge base content |

### Pre-loaded Knowledge Base
- Investment Policy Statement Guidelines
- Rebalancing Best Practices
- Client Communication Standards
- Fee Schedule and Billing
- Risk Assessment Procedures
- ESG and Sustainable Investing
- Retirement Planning Guidelines
- Tax-Loss Harvesting Procedures

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **AI SDK**: v6 with ToolLoopAgent patterns
- **AI Gateway**: Vercel AI Gateway (100+ models)
- **Database**: PostgreSQL (Supabase/Neon)
- **ORM**: Drizzle
- **UI**: shadcn/ui + Tailwind CSS
- **Auth**: Auth.js (NextAuth)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Vercel AI Gateway API key

### Installation

```bash
# Clone the repository
cd financial-advisor-ai

# Install dependencies
npm install --legacy-peer-deps

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables

```env
# Required
AUTH_SECRET=your-auth-secret-32-chars
AI_GATEWAY_API_KEY=your-vercel-ai-gateway-key
POSTGRES_URL=your-supabase-connection-string

# Optional
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
REDIS_URL=your-redis-url-for-resumable-streams
```

## Project Structure

```
financial-advisor-ai/
├── app/
│   ├── (auth)/          # Authentication routes
│   └── (chat)/          # Chat interface
│       └── api/
│           └── chat/    # Chat API with tools
├── lib/
│   ├── ai/
│   │   ├── tools/       # Financial advisor tools
│   │   │   ├── search-clients.ts
│   │   │   ├── portfolio.ts
│   │   │   ├── market-data.ts
│   │   │   └── knowledge-base.ts
│   │   ├── financial-advisor-prompts.ts
│   │   └── providers.ts
│   └── db/
│       └── schema/
│           └── financial-advisor.ts  # Client/portfolio schema
├── components/
│   ├── ai-elements/     # Pre-built AI UI components
│   └── ...
└── artifacts/           # Document generation
```

## Customization

### Adding New Tools

1. Create a new tool file in `lib/ai/tools/`:

```typescript
import { tool } from "ai";
import { z } from "zod";

export const myNewTool = tool({
  description: "Description for the AI",
  inputSchema: z.object({
    param: z.string().describe("Parameter description"),
  }),
  execute: async ({ param }) => {
    // Your logic here
    return { result: "data" };
  },
});
```

2. Import and add to `app/(chat)/api/chat/route.ts`:

```typescript
import { myNewTool } from "@/lib/ai/tools/my-new-tool";

// Add to tools object
tools: {
  myNewTool,
  // ... other tools
}

// Add to experimental_activeTools array
experimental_activeTools: [
  "myNewTool",
  // ... other tools
]
```

### Connecting Real Data Sources

The current tools use mock data. To connect real data:

1. **Portfolio Data**: Replace mock data with API calls to:
   - BlackDiamond
   - Orion
   - Tamarac
   - Envestnet

2. **Market Data**: Integrate with:
   - Alpha Vantage
   - Yahoo Finance
   - Bloomberg API
   - Polygon.io

3. **Client Data**: Connect to your CRM:
   - Salesforce
   - Redtail
   - Wealthbox
   - Custom database

### Adding RAG with Embeddings

1. Enable pgvector in your Supabase database
2. Uncomment the `embedding` column in `lib/db/schema/financial-advisor.ts`
3. Use `embed()` from AI SDK to generate embeddings
4. Update `searchKnowledgeBase` to use cosine similarity

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Self-Hosted

```bash
npm run build
npm start
```

## TODO

- [ ] Fix Supabase database connection (need correct region)
- [ ] Add real portfolio data integration
- [ ] Implement Azure AD authentication
- [ ] Add real-time market data
- [ ] Enable pgvector for RAG embeddings
- [ ] Add email integration (Microsoft Graph)
- [ ] Add file storage integration (Box.com)
- [ ] Implement row-level security

## License

Based on Vercel's Chat SDK - see original LICENSE file.
