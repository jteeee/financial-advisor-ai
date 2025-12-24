import { tool } from "ai";
import { z } from "zod";

// Mock market data - in production, integrate with Alpha Vantage, Yahoo Finance, Bloomberg, etc.
const mockQuotes: Record<string, any> = {
  AAPL: {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 210.25,
    change: 2.15,
    changePercent: 1.03,
    volume: 45678900,
    marketCap: "3.24T",
    pe: 28.5,
    dividend: 0.96,
    dividendYield: 0.46,
    high52w: 220.5,
    low52w: 165.25,
    exchange: "NASDAQ",
  },
  MSFT: {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: 420.5,
    change: -1.25,
    changePercent: -0.3,
    volume: 23456789,
    marketCap: "3.12T",
    pe: 35.2,
    dividend: 3.0,
    dividendYield: 0.71,
    high52w: 430.82,
    low52w: 332.15,
    exchange: "NASDAQ",
  },
  VTI: {
    symbol: "VTI",
    name: "Vanguard Total Stock Market ETF",
    price: 250.0,
    change: 1.5,
    changePercent: 0.6,
    volume: 3456789,
    marketCap: "380B",
    pe: 23.1,
    dividend: 3.25,
    dividendYield: 1.3,
    high52w: 252.0,
    low52w: 198.5,
    exchange: "NYSE",
    expenseRatio: 0.03,
    holdings: 3945,
  },
  SPY: {
    symbol: "SPY",
    name: "SPDR S&P 500 ETF",
    price: 600.0,
    change: 3.2,
    changePercent: 0.54,
    volume: 65432100,
    marketCap: "550B",
    pe: 24.5,
    dividend: 6.5,
    dividendYield: 1.08,
    high52w: 605.0,
    low52w: 480.25,
    exchange: "NYSE",
    expenseRatio: 0.09,
    holdings: 503,
  },
  BND: {
    symbol: "BND",
    name: "Vanguard Total Bond Market ETF",
    price: 74.0,
    change: -0.15,
    changePercent: -0.2,
    volume: 8765432,
    marketCap: "105B",
    pe: null,
    dividend: 2.8,
    dividendYield: 3.78,
    high52w: 76.5,
    low52w: 69.25,
    exchange: "NYSE",
    expenseRatio: 0.03,
    duration: 6.2,
    avgCreditQuality: "AA",
  },
};

const mockNews = [
  {
    id: "news-1",
    title: "Fed Signals Potential Rate Cuts in 2025",
    source: "Reuters",
    publishedAt: "2024-12-23T14:30:00Z",
    summary:
      "Federal Reserve officials indicated they may begin cutting interest rates in the first half of 2025, citing cooling inflation and stable employment.",
    symbols: ["SPY", "BND", "TLT"],
    sentiment: "positive",
    category: "monetary-policy",
  },
  {
    id: "news-2",
    title: "Apple Announces Record iPhone Sales in Q4",
    source: "Bloomberg",
    publishedAt: "2024-12-23T10:15:00Z",
    summary:
      "Apple reported record-breaking iPhone sales in the holiday quarter, driven by strong demand for the iPhone 15 Pro models in emerging markets.",
    symbols: ["AAPL"],
    sentiment: "positive",
    category: "earnings",
  },
  {
    id: "news-3",
    title: "Microsoft Azure Growth Exceeds Expectations",
    source: "CNBC",
    publishedAt: "2024-12-22T16:45:00Z",
    summary:
      "Microsoft's cloud computing division Azure reported 35% year-over-year growth, beating analyst expectations by 3 percentage points.",
    symbols: ["MSFT"],
    sentiment: "positive",
    category: "earnings",
  },
  {
    id: "news-4",
    title: "Bond Markets Rally on Inflation Data",
    source: "Wall Street Journal",
    publishedAt: "2024-12-22T09:00:00Z",
    summary:
      "Treasury bonds rallied sharply after CPI data showed inflation cooling faster than expected, with yields falling across the curve.",
    symbols: ["BND", "TLT", "AGG"],
    sentiment: "positive",
    category: "fixed-income",
  },
  {
    id: "news-5",
    title: "Tech Sector Faces Regulatory Headwinds in EU",
    source: "Financial Times",
    publishedAt: "2024-12-21T12:30:00Z",
    summary:
      "European regulators announced new investigations into AI practices at major tech companies, potentially impacting future growth.",
    symbols: ["AAPL", "MSFT", "GOOGL", "META"],
    sentiment: "negative",
    category: "regulatory",
  },
];

export const getMarketQuote = tool({
  description:
    "Get current market quote and key statistics for a stock or ETF symbol.",
  inputSchema: z.object({
    symbol: z
      .string()
      .describe("Stock or ETF ticker symbol (e.g., AAPL, VTI, SPY)"),
  }),
  execute: async ({ symbol }) => {
    const upperSymbol = symbol.toUpperCase();
    const quote = mockQuotes[upperSymbol];

    if (!quote) {
      // Return a generic response for unknown symbols
      return {
        success: false,
        error: `Quote not found for symbol "${upperSymbol}". This may be an invalid symbol or data is temporarily unavailable.`,
        suggestion:
          "Try common symbols like AAPL, MSFT, VTI, SPY, or BND for demo purposes.",
      };
    }

    return {
      success: true,
      quote: {
        ...quote,
        asOfTime: new Date().toISOString(),
        marketStatus: "open", // In production, check actual market hours
      },
    };
  },
});

export const getMultipleQuotes = tool({
  description: "Get current market quotes for multiple symbols at once.",
  inputSchema: z.object({
    symbols: z
      .array(z.string())
      .describe("Array of ticker symbols to quote"),
  }),
  execute: async ({ symbols }) => {
    const quotes = symbols.map((symbol) => {
      const upperSymbol = symbol.toUpperCase();
      const quote = mockQuotes[upperSymbol];
      return quote
        ? { success: true, ...quote }
        : { success: false, symbol: upperSymbol, error: "Quote not found" };
    });

    return {
      success: true,
      asOfTime: new Date().toISOString(),
      quotes,
    };
  },
});

export const searchMarketNews = tool({
  description:
    "Search for market news and financial headlines. Can filter by symbols or topics.",
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe("Search query for news (e.g., 'interest rates', 'tech earnings')"),
    symbols: z
      .array(z.string())
      .optional()
      .describe("Filter news by specific ticker symbols"),
    category: z
      .enum([
        "all",
        "earnings",
        "monetary-policy",
        "regulatory",
        "fixed-income",
        "market-commentary",
      ])
      .optional()
      .default("all")
      .describe("News category filter"),
    limit: z.number().optional().default(5).describe("Maximum articles to return"),
  }),
  execute: async ({ query, symbols, category, limit }) => {
    let filteredNews = [...mockNews];

    // Filter by symbols
    if (symbols && symbols.length > 0) {
      const upperSymbols = symbols.map((s) => s.toUpperCase());
      filteredNews = filteredNews.filter((news) =>
        news.symbols.some((s) => upperSymbols.includes(s))
      );
    }

    // Filter by category
    if (category && category !== "all") {
      filteredNews = filteredNews.filter((news) => news.category === category);
    }

    // Filter by query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredNews = filteredNews.filter(
        (news) =>
          news.title.toLowerCase().includes(lowerQuery) ||
          news.summary.toLowerCase().includes(lowerQuery)
      );
    }

    // Limit results
    filteredNews = filteredNews.slice(0, limit);

    return {
      success: true,
      query: query || null,
      symbols: symbols || null,
      category,
      resultCount: filteredNews.length,
      articles: filteredNews,
    };
  },
});

export const getMarketOverview = tool({
  description:
    "Get a broad market overview including major indices, sector performance, and market sentiment.",
  inputSchema: z.object({}),
  execute: async () => {
    return {
      success: true,
      asOfTime: new Date().toISOString(),
      indices: [
        { name: "S&P 500", value: 6000.25, change: 25.5, changePercent: 0.43 },
        { name: "Dow Jones", value: 42500.0, change: 150.25, changePercent: 0.35 },
        { name: "NASDAQ", value: 19800.5, change: 85.75, changePercent: 0.43 },
        { name: "Russell 2000", value: 2050.0, change: -5.25, changePercent: -0.26 },
      ],
      sectors: [
        { name: "Technology", changePercent: 0.85 },
        { name: "Healthcare", changePercent: 0.42 },
        { name: "Financials", changePercent: 0.31 },
        { name: "Consumer Discretionary", changePercent: -0.15 },
        { name: "Energy", changePercent: -0.52 },
        { name: "Utilities", changePercent: 0.18 },
        { name: "Real Estate", changePercent: 0.25 },
        { name: "Materials", changePercent: -0.08 },
        { name: "Industrials", changePercent: 0.22 },
        { name: "Communication Services", changePercent: 0.65 },
        { name: "Consumer Staples", changePercent: 0.12 },
      ],
      treasuryYields: {
        "2Y": 4.25,
        "5Y": 4.05,
        "10Y": 4.35,
        "30Y": 4.55,
      },
      vix: 14.5,
      marketSentiment: "bullish",
      tradingVolume: "above average",
    };
  },
});
