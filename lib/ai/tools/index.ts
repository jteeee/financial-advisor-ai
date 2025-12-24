// Financial Advisor Tools - Export all tools
export { searchClients, getClientProfile } from "./search-clients";
export {
  getPortfolioHoldings,
  getPortfolioPerformance,
  getAssetAllocation,
} from "./portfolio";
export {
  getMarketQuote,
  getMultipleQuotes,
  searchMarketNews,
  getMarketOverview,
} from "./market-data";
export { searchKnowledgeBase, getKnowledgeBaseArticle } from "./knowledge-base";

// Re-export existing tools from the original template
export { getWeather } from "./get-weather";
export { createDocument } from "./create-document";
export { updateDocument } from "./update-document";
export { requestSuggestions } from "./request-suggestions";
