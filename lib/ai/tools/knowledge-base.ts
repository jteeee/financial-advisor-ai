import { tool } from "ai";
import { z } from "zod";

// Mock knowledge base content - will be replaced with RAG using pgvector embeddings
const knowledgeBase = [
  {
    id: "kb-001",
    title: "Investment Policy Statement Guidelines",
    category: "compliance",
    content: `An Investment Policy Statement (IPS) is a document that outlines a client's investment objectives, risk tolerance, and constraints. Every client must have an IPS on file before investing.

Key components of an IPS:
1. Client Information - Name, accounts, beneficiaries
2. Investment Objectives - Growth, income, capital preservation
3. Time Horizon - Short-term (<3 years), Medium (3-10), Long-term (>10)
4. Risk Tolerance - Conservative, Moderate, Aggressive
5. Asset Allocation Targets - Target percentages for each asset class
6. Rebalancing Policy - Thresholds and frequency
7. Restrictions - Excluded securities, ESG preferences
8. Review Schedule - Annual or upon life changes

The IPS should be reviewed annually and updated when:
- Client's financial situation changes
- Major life events (retirement, inheritance, etc.)
- Risk tolerance changes
- Market conditions warrant strategy adjustment`,
    relevanceScore: 0,
  },
  {
    id: "kb-002",
    title: "Rebalancing Best Practices",
    category: "investment-management",
    content: `Portfolio rebalancing restores a portfolio to its target asset allocation. Our firm recommends:

Rebalancing Triggers:
- Time-based: Review quarterly, rebalance semi-annually minimum
- Threshold-based: Rebalance when allocation drifts >5% from target

Rebalancing Methods:
1. Calendar Rebalancing - Fixed schedule (quarterly, semi-annually)
2. Threshold Rebalancing - When drift exceeds tolerance bands
3. Cash Flow Rebalancing - Use deposits/withdrawals to rebalance

Tax-Efficient Rebalancing:
- Rebalance in tax-advantaged accounts first (IRA, 401k)
- Use new contributions to underweight asset classes
- Consider tax-loss harvesting opportunities
- Avoid short-term capital gains when possible

Documentation Requirements:
- Record rebalancing rationale
- Document client communication
- Note any tax implications discussed`,
    relevanceScore: 0,
  },
  {
    id: "kb-003",
    title: "Client Communication Standards",
    category: "compliance",
    content: `All client communications must meet regulatory and firm standards:

Required Communications:
- Quarterly performance reports
- Annual IPS review invitation
- Material account changes notification
- Fee disclosure annually

Communication Best Practices:
- Respond to client inquiries within 24 business hours
- Document all substantive communications in CRM
- Use approved templates for formal correspondence
- Never guarantee returns or make projections without disclosure

Prohibited Communications:
- Promising specific returns
- Recommending without suitability review
- Sharing other clients' information
- Making statements not supported by research

Social Media Policy:
- All posts must be pre-approved
- No investment advice on social platforms
- Archive all social media communications`,
    relevanceScore: 0,
  },
  {
    id: "kb-004",
    title: "Fee Schedule and Billing",
    category: "operations",
    content: `Our firm's standard fee schedule:

Advisory Fees (Annual, billed quarterly):
- $0 - $500,000: 1.00%
- $500,001 - $1,000,000: 0.85%
- $1,000,001 - $3,000,000: 0.75%
- $3,000,001 - $5,000,000: 0.60%
- $5,000,001+: 0.50%

Financial Planning Fees:
- Comprehensive Plan: $2,500 - $5,000 (one-time)
- Plan Update: $500 - $1,000 (annual)

Fee Calculations:
- Fees calculated on quarter-end market value
- Pro-rated for partial quarters
- Deducted from accounts unless otherwise arranged

Fee Disclosures:
- ADV Part 2 provided annually
- Fee schedule in client agreement
- Written notice 30 days before fee changes`,
    relevanceScore: 0,
  },
  {
    id: "kb-005",
    title: "Risk Assessment Procedures",
    category: "investment-management",
    content: `Client risk assessment must be completed during onboarding and reviewed annually.

Risk Tolerance Categories:
1. Conservative - Capital preservation, minimal volatility
2. Moderately Conservative - Income focus, some growth
3. Moderate - Balanced growth and income
4. Moderately Aggressive - Growth focus, can tolerate volatility
5. Aggressive - Maximum growth, high volatility tolerance

Assessment Factors:
- Investment timeline
- Income stability
- Net worth and liquidity
- Investment experience
- Emotional response to market declines

Risk Capacity vs Risk Tolerance:
- Capacity = Financial ability to take risk
- Tolerance = Emotional willingness to take risk
- Invest based on the LOWER of the two

Documentation:
- Risk questionnaire in client file
- Explanation if portfolio differs from risk level
- Annual review confirmation`,
    relevanceScore: 0,
  },
  {
    id: "kb-006",
    title: "ESG and Sustainable Investing",
    category: "investment-management",
    content: `Our firm offers ESG (Environmental, Social, Governance) investment options:

ESG Approaches:
1. Exclusionary Screening - Avoid certain industries (tobacco, weapons)
2. ESG Integration - Consider ESG factors alongside financial
3. Impact Investing - Target measurable positive outcomes
4. Shareholder Advocacy - Proxy voting for ESG issues

Available ESG Options:
- ESG-focused ETFs (ESGU, SUSA, ESGV)
- Sustainable bond funds
- Impact-focused alternatives

Client Suitability:
- Document ESG preferences in IPS
- Explain potential performance differences
- Review ESG holdings quarterly

Reporting:
- ESG metrics in quarterly reports (optional)
- Impact measurement for dedicated portfolios`,
    relevanceScore: 0,
  },
  {
    id: "kb-007",
    title: "Retirement Planning Guidelines",
    category: "financial-planning",
    content: `Retirement planning framework for client discussions:

Key Planning Elements:
1. Retirement Income Needs
   - Essential expenses (housing, healthcare, food)
   - Discretionary expenses (travel, hobbies)
   - Legacy goals

2. Income Sources
   - Social Security (estimate at various ages)
   - Pensions
   - Portfolio withdrawals
   - Part-time work

3. Withdrawal Strategies
   - 4% rule as starting point
   - Dynamic spending based on market
   - Tax-efficient withdrawal sequencing

Tax-Efficient Withdrawal Order:
1. Taxable accounts (capital gains rates)
2. Tax-deferred accounts (ordinary income)
3. Roth accounts (tax-free, preserve longest)

Required Minimum Distributions:
- Begin at age 73 (SECURE Act 2.0)
- Calculate separately for each account
- Penalties for missed RMDs: 25% (reduced from 50%)`,
    relevanceScore: 0,
  },
  {
    id: "kb-008",
    title: "Tax-Loss Harvesting Procedures",
    category: "investment-management",
    content: `Tax-loss harvesting guidelines for taxable accounts:

When to Harvest:
- Unrealized losses exceeding $1,000
- Year-end tax planning (October-December)
- Opportunistically during market declines

Wash Sale Rules:
- Cannot repurchase substantially identical security
- 30-day window before and after sale
- Applies across all accounts (including IRAs)

Replacement Strategies:
- Similar but not identical ETF
- Index fund tracking different benchmark
- Wait 31 days to repurchase

Documentation:
- Record original cost basis
- Document replacement security rationale
- Track loss carryforwards

Annual Limits:
- $3,000 net loss deduction against ordinary income
- Unlimited carryforward of excess losses
- Track short-term vs long-term separately`,
    relevanceScore: 0,
  },
];

// Simple text matching for demo - in production, use embeddings + cosine similarity
function calculateRelevance(content: string, query: string): number {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const words = lowerQuery.split(/\s+/);

  let matches = 0;
  for (const word of words) {
    if (word.length > 2 && lowerContent.includes(word)) {
      matches++;
    }
  }

  return matches / words.length;
}

export const searchKnowledgeBase = tool({
  description:
    "Search the firm's knowledge base for policies, procedures, investment guidelines, and best practices. Use this to answer questions about compliance, investment management, or firm policies.",
  inputSchema: z.object({
    query: z
      .string()
      .describe("Search query - what information are you looking for?"),
    category: z
      .enum([
        "all",
        "compliance",
        "investment-management",
        "financial-planning",
        "operations",
      ])
      .optional()
      .default("all")
      .describe("Filter by knowledge base category"),
    limit: z
      .number()
      .optional()
      .default(3)
      .describe("Maximum number of results"),
  }),
  execute: async ({ query, category, limit }) => {
    let results = knowledgeBase.map((kb) => ({
      ...kb,
      relevanceScore: calculateRelevance(kb.content, query),
    }));

    // Filter by category
    if (category !== "all") {
      results = results.filter((kb) => kb.category === category);
    }

    // Sort by relevance and limit
    results = results
      .filter((kb) => kb.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    if (results.length === 0) {
      return {
        success: false,
        message: `No knowledge base articles found matching "${query}"`,
        suggestion:
          "Try broader search terms or different category. Available categories: compliance, investment-management, financial-planning, operations",
      };
    }

    return {
      success: true,
      query,
      category,
      resultCount: results.length,
      articles: results.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        content: r.content,
        relevance: (r.relevanceScore * 100).toFixed(0) + "%",
      })),
    };
  },
});

export const getKnowledgeBaseArticle = tool({
  description: "Get a specific knowledge base article by its ID.",
  inputSchema: z.object({
    articleId: z.string().describe("The knowledge base article ID"),
  }),
  execute: async ({ articleId }) => {
    const article = knowledgeBase.find((kb) => kb.id === articleId);

    if (!article) {
      return {
        success: false,
        error: `Article "${articleId}" not found`,
      };
    }

    return {
      success: true,
      article: {
        id: article.id,
        title: article.title,
        category: article.category,
        content: article.content,
      },
    };
  },
});
