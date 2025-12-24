import { tool } from "ai";
import { z } from "zod";

// Mock portfolio data - will be replaced with real API calls to BlackDiamond, Orion, etc.
const mockHoldings: Record<string, any[]> = {
  "acc-001": [
    // John Smith's IRA
    {
      symbol: "VTI",
      name: "Vanguard Total Stock Market ETF",
      quantity: 500,
      costBasis: 85000,
      marketValue: 125000,
      assetClass: "US Equity",
      sector: "Diversified",
      weight: 27.8,
    },
    {
      symbol: "VXUS",
      name: "Vanguard Total International Stock ETF",
      quantity: 600,
      costBasis: 28000,
      marketValue: 35400,
      assetClass: "International Equity",
      sector: "Diversified",
      weight: 7.9,
    },
    {
      symbol: "BND",
      name: "Vanguard Total Bond Market ETF",
      quantity: 1200,
      costBasis: 90000,
      marketValue: 88800,
      assetClass: "Fixed Income",
      sector: "Bonds",
      weight: 19.7,
    },
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      quantity: 200,
      costBasis: 25000,
      marketValue: 42000,
      assetClass: "US Equity",
      sector: "Technology",
      weight: 9.3,
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corporation",
      quantity: 150,
      costBasis: 30000,
      marketValue: 63000,
      assetClass: "US Equity",
      sector: "Technology",
      weight: 14.0,
    },
    {
      symbol: "CASH",
      name: "Money Market",
      quantity: 1,
      costBasis: 95800,
      marketValue: 95800,
      assetClass: "Cash",
      sector: "Cash",
      weight: 21.3,
    },
  ],
  "acc-002": [
    // John Smith's Brokerage
    {
      symbol: "SPY",
      name: "SPDR S&P 500 ETF",
      quantity: 800,
      costBasis: 320000,
      marketValue: 480000,
      assetClass: "US Equity",
      sector: "Large Cap",
      weight: 60.0,
    },
    {
      symbol: "QQQ",
      name: "Invesco QQQ Trust",
      quantity: 300,
      costBasis: 90000,
      marketValue: 156000,
      assetClass: "US Equity",
      sector: "Technology",
      weight: 19.5,
    },
    {
      symbol: "VNQ",
      name: "Vanguard Real Estate ETF",
      quantity: 500,
      costBasis: 42000,
      marketValue: 44000,
      assetClass: "Real Estate",
      sector: "REITs",
      weight: 5.5,
    },
    {
      symbol: "GLD",
      name: "SPDR Gold Shares",
      quantity: 200,
      costBasis: 35000,
      marketValue: 48000,
      assetClass: "Commodities",
      sector: "Precious Metals",
      weight: 6.0,
    },
    {
      symbol: "CASH",
      name: "Money Market",
      quantity: 1,
      costBasis: 72000,
      marketValue: 72000,
      assetClass: "Cash",
      sector: "Cash",
      weight: 9.0,
    },
  ],
  "acc-003": [
    // Sarah Johnson's 401k
    {
      symbol: "VFIAX",
      name: "Vanguard 500 Index Admiral",
      quantity: 1500,
      costBasis: 400000,
      marketValue: 720000,
      assetClass: "US Equity",
      sector: "Large Cap",
      weight: 60.0,
    },
    {
      symbol: "VBTLX",
      name: "Vanguard Total Bond Market Index Admiral",
      quantity: 3000,
      costBasis: 280000,
      marketValue: 300000,
      assetClass: "Fixed Income",
      sector: "Bonds",
      weight: 25.0,
    },
    {
      symbol: "VTIAX",
      name: "Vanguard Total International Stock Index Admiral",
      quantity: 2000,
      costBasis: 150000,
      marketValue: 180000,
      assetClass: "International Equity",
      sector: "Diversified",
      weight: 15.0,
    },
  ],
};

const mockPerformance: Record<
  string,
  { period: string; return: number; benchmark: number }[]
> = {
  "client-001": [
    { period: "MTD", return: 2.3, benchmark: 2.1 },
    { period: "QTD", return: 5.8, benchmark: 5.2 },
    { period: "YTD", return: 18.5, benchmark: 16.8 },
    { period: "1Y", return: 22.3, benchmark: 20.1 },
    { period: "3Y", return: 8.2, benchmark: 7.5 },
    { period: "5Y", return: 10.5, benchmark: 9.8 },
    { period: "ITD", return: 45.2, benchmark: 42.1 },
  ],
  "client-002": [
    { period: "MTD", return: 3.1, benchmark: 2.1 },
    { period: "QTD", return: 7.2, benchmark: 5.2 },
    { period: "YTD", return: 24.5, benchmark: 16.8 },
    { period: "1Y", return: 28.1, benchmark: 20.1 },
    { period: "3Y", return: 12.5, benchmark: 7.5 },
    { period: "5Y", return: 14.2, benchmark: 9.8 },
    { period: "ITD", return: 85.3, benchmark: 62.4 },
  ],
  "client-003": [
    { period: "MTD", return: 1.2, benchmark: 2.1 },
    { period: "QTD", return: 3.5, benchmark: 5.2 },
    { period: "YTD", return: 10.2, benchmark: 16.8 },
    { period: "1Y", return: 12.5, benchmark: 20.1 },
    { period: "3Y", return: 5.8, benchmark: 7.5 },
    { period: "5Y", return: 6.2, benchmark: 9.8 },
    { period: "ITD", return: 18.5, benchmark: 25.2 },
  ],
};

export const getPortfolioHoldings = tool({
  description:
    "Get current portfolio holdings for a client account. Shows positions, values, allocation, and unrealized gains/losses.",
  inputSchema: z.object({
    accountId: z
      .string()
      .describe("The account ID to get holdings for (e.g., acc-001)"),
    groupBy: z
      .enum(["none", "assetClass", "sector"])
      .optional()
      .default("none")
      .describe("How to group the holdings"),
  }),
  execute: async ({ accountId, groupBy }) => {
    const holdings = mockHoldings[accountId];

    if (!holdings) {
      return {
        success: false,
        error: `No holdings found for account "${accountId}"`,
      };
    }

    const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
    const totalCost = holdings.reduce((sum, h) => sum + h.costBasis, 0);
    const totalGain = totalValue - totalCost;
    const totalGainPercent = ((totalGain / totalCost) * 100).toFixed(2);

    if (groupBy === "none") {
      return {
        success: true,
        accountId,
        asOfDate: new Date().toISOString().split("T")[0],
        summary: {
          totalMarketValue: totalValue,
          totalCostBasis: totalCost,
          totalUnrealizedGain: totalGain,
          totalUnrealizedGainPercent: parseFloat(totalGainPercent),
          positionCount: holdings.length,
        },
        holdings: holdings.map((h) => ({
          ...h,
          unrealizedGain: h.marketValue - h.costBasis,
          unrealizedGainPercent: (
            ((h.marketValue - h.costBasis) / h.costBasis) *
            100
          ).toFixed(2),
        })),
      };
    }

    // Group holdings
    const grouped = holdings.reduce(
      (acc, h) => {
        const key = groupBy === "assetClass" ? h.assetClass : h.sector;
        if (!acc[key]) {
          acc[key] = { holdings: [], totalValue: 0, totalCost: 0, weight: 0 };
        }
        acc[key].holdings.push(h);
        acc[key].totalValue += h.marketValue;
        acc[key].totalCost += h.costBasis;
        return acc;
      },
      {} as Record<string, any>
    );

    // Calculate weights
    Object.keys(grouped).forEach((key) => {
      grouped[key].weight = ((grouped[key].totalValue / totalValue) * 100).toFixed(1);
      grouped[key].unrealizedGain = grouped[key].totalValue - grouped[key].totalCost;
    });

    return {
      success: true,
      accountId,
      asOfDate: new Date().toISOString().split("T")[0],
      summary: {
        totalMarketValue: totalValue,
        totalCostBasis: totalCost,
        totalUnrealizedGain: totalGain,
        totalUnrealizedGainPercent: parseFloat(totalGainPercent),
        positionCount: holdings.length,
      },
      groupedBy: groupBy,
      groups: grouped,
    };
  },
});

export const getPortfolioPerformance = tool({
  description:
    "Get portfolio performance metrics for a client. Shows returns across different time periods compared to benchmarks.",
  inputSchema: z.object({
    clientId: z.string().describe("The client ID"),
    benchmark: z
      .string()
      .optional()
      .default("S&P 500")
      .describe("Benchmark to compare against"),
  }),
  execute: async ({ clientId, benchmark }) => {
    const performance = mockPerformance[clientId];

    if (!performance) {
      return {
        success: false,
        error: `No performance data found for client "${clientId}"`,
      };
    }

    return {
      success: true,
      clientId,
      benchmark,
      asOfDate: new Date().toISOString().split("T")[0],
      performance: performance.map((p) => ({
        ...p,
        excessReturn: (p.return - p.benchmark).toFixed(2),
        outperformed: p.return > p.benchmark,
      })),
      summary: {
        ytdReturn: performance.find((p) => p.period === "YTD")?.return,
        ytdBenchmark: performance.find((p) => p.period === "YTD")?.benchmark,
        ytdExcess: (
          (performance.find((p) => p.period === "YTD")?.return || 0) -
          (performance.find((p) => p.period === "YTD")?.benchmark || 0)
        ).toFixed(2),
      },
    };
  },
});

export const getAssetAllocation = tool({
  description:
    "Get the current asset allocation for a client across all their accounts. Shows target vs actual allocation.",
  inputSchema: z.object({
    clientId: z.string().describe("The client ID"),
  }),
  execute: async ({ clientId }) => {
    // Mock allocation data
    const allocation = {
      "client-001": {
        target: {
          "US Equity": 45,
          "International Equity": 15,
          "Fixed Income": 25,
          "Real Estate": 5,
          Cash: 10,
        },
        actual: {
          "US Equity": 51.1,
          "International Equity": 7.9,
          "Fixed Income": 19.7,
          "Real Estate": 0,
          Cash: 21.3,
        },
      },
      "client-002": {
        target: {
          "US Equity": 60,
          "International Equity": 20,
          "Fixed Income": 15,
          Cash: 5,
        },
        actual: {
          "US Equity": 60,
          "International Equity": 15,
          "Fixed Income": 25,
          Cash: 0,
        },
      },
    };

    const clientAllocation = allocation[clientId as keyof typeof allocation];

    if (!clientAllocation) {
      return {
        success: false,
        error: `No allocation data found for client "${clientId}"`,
      };
    }

    const drift = Object.keys(clientAllocation.target).map((assetClass) => ({
      assetClass,
      target: clientAllocation.target[assetClass as keyof typeof clientAllocation.target] || 0,
      actual: clientAllocation.actual[assetClass as keyof typeof clientAllocation.actual] || 0,
      drift:
        (clientAllocation.actual[assetClass as keyof typeof clientAllocation.actual] || 0) -
        (clientAllocation.target[assetClass as keyof typeof clientAllocation.target] || 0),
    }));

    const needsRebalancing = drift.some((d) => Math.abs(d.drift) > 5);

    return {
      success: true,
      clientId,
      asOfDate: new Date().toISOString().split("T")[0],
      allocation: drift,
      needsRebalancing,
      rebalancingRecommendation: needsRebalancing
        ? "Portfolio has drifted more than 5% from target in one or more asset classes. Consider rebalancing."
        : "Portfolio is within acceptable drift tolerance.",
    };
  },
});
