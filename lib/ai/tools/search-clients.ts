import { tool } from "ai";
import { z } from "zod";
import { clientsDb, isClientsDbAvailable } from "@/lib/db/clients-db";

// Types for database results
interface ClientSearchResult {
  full_name: string;
  first_name: string;
  last_name: string;
  accounts: Array<{
    id: string;
    account_number: string;
    name: string;
    type: string;
    value: number;
    custodian: string;
  }>;
  total_aum: string | number;
  account_count: string | number;
}

interface AccountResult {
  first_name: string;
  last_name: string;
  full_name: string;
  owner_type: string;
  account_id: string;
  account_number: string;
  account_name: string;
  account_type: string;
  market_value: string | number | null;
  cost_basis: string | number | null;
  unrealized_gain_loss: string | number | null;
  custodian: string;
  inception_date: string | null;
  is_billable: boolean;
  is_discretionary: boolean;
}

interface HoldingResult {
  ticker: string;
  asset_name: string;
  asset_class: string;
  units: string | number | null;
  market_value: string | number | null;
  cost_basis: string | number | null;
  unrealized_gain_loss: string | number | null;
}

// Mock data for fallback when database is not available
const mockClients = [
  {
    id: "client-001",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@email.com",
    phone: "(555) 123-4567",
    status: "active",
    riskTolerance: "moderate",
    totalAUM: 1250000,
    accounts: [
      { id: "acc-001", type: "IRA", value: 450000 },
      { id: "acc-002", type: "Brokerage", value: 800000 },
    ],
    primaryAdvisor: "current-user",
    onboardingDate: "2019-03-15",
    lastContactDate: "2024-12-15",
  },
  {
    id: "client-002",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.j@email.com",
    phone: "(555) 234-5678",
    status: "active",
    riskTolerance: "aggressive",
    totalAUM: 3500000,
    accounts: [
      { id: "acc-003", type: "401k", value: 1200000 },
      { id: "acc-004", type: "Roth IRA", value: 800000 },
      { id: "acc-005", type: "Trust", value: 1500000 },
    ],
    primaryAdvisor: "current-user",
    onboardingDate: "2017-08-22",
    lastContactDate: "2024-12-20",
  },
];

// Search clients in the real database
async function searchClientsInDb(query: string, limit: number): Promise<ClientSearchResult[] | null> {
  if (!clientsDb) return null;

  try {
    // Search across account_owners joined with accounts for rich client data
    const searchPattern = `%${query}%`;

    const results = await clientsDb<ClientSearchResult[]>`
      WITH client_accounts AS (
        SELECT
          ao.id as owner_id,
          ao.first_name,
          ao.last_name,
          ao.full_name,
          ao.owner_type,
          a.id as account_id,
          a.account_number,
          a.name as account_name,
          a.account_type,
          a.market_value,
          a.custodian
        FROM account_owners ao
        JOIN accounts a ON ao.account_id = a.id
        WHERE a.is_closed = false
      ),
      client_summary AS (
        SELECT
          first_name,
          last_name,
          TRIM(full_name) as full_name,
          array_agg(DISTINCT jsonb_build_object(
            'id', account_id,
            'account_number', account_number,
            'name', account_name,
            'type', account_type,
            'value', market_value,
            'custodian', custodian
          )) as accounts,
          SUM(market_value::numeric) as total_aum,
          COUNT(DISTINCT account_id) as account_count
        FROM client_accounts
        GROUP BY first_name, last_name, TRIM(full_name)
      )
      SELECT
        full_name,
        first_name,
        last_name,
        accounts,
        total_aum,
        account_count
      FROM client_summary
      WHERE
        LOWER(full_name) LIKE LOWER(${searchPattern})
        OR LOWER(first_name) LIKE LOWER(${searchPattern})
        OR LOWER(last_name) LIKE LOWER(${searchPattern})
        OR EXISTS (
          SELECT 1 FROM unnest(accounts) as acc
          WHERE LOWER(acc->>'account_number') LIKE LOWER(${searchPattern})
        )
      ORDER BY total_aum DESC NULLS LAST
      LIMIT ${limit}
    `;

    return results;
  } catch (error) {
    console.error("Error searching clients in database:", error);
    return null;
  }
}

// Get client profile from the real database
async function getClientProfileFromDb(clientName: string): Promise<{ accounts: AccountResult[]; holdings: HoldingResult[] } | null> {
  if (!clientsDb) return null;

  try {
    // Find client by name and get all their accounts
    const searchPattern = `%${clientName}%`;

    const accounts = await clientsDb<AccountResult[]>`
      SELECT
        ao.first_name,
        ao.last_name,
        TRIM(ao.full_name) as full_name,
        ao.owner_type,
        a.id as account_id,
        a.account_number,
        a.name as account_name,
        a.account_type,
        a.market_value,
        a.cost_basis,
        a.unrealized_gain_loss,
        a.custodian,
        a.inception_date,
        a.is_billable,
        a.is_discretionary
      FROM account_owners ao
      JOIN accounts a ON ao.account_id = a.id
      WHERE a.is_closed = false
        AND (
          LOWER(TRIM(ao.full_name)) LIKE LOWER(${searchPattern})
          OR LOWER(ao.first_name) LIKE LOWER(${searchPattern})
          OR LOWER(ao.last_name) LIKE LOWER(${searchPattern})
        )
      ORDER BY a.market_value DESC NULLS LAST
    `;

    if (accounts.length === 0) return null;

    // Get holdings for the first account to show sample positions
    const firstAccount = accounts[0];
    const holdings = await clientsDb<HoldingResult[]>`
      SELECT
        h.ticker,
        h.asset_name,
        h.asset_class,
        h.units,
        h.market_value,
        h.cost_basis,
        h.unrealized_gain_loss
      FROM holdings h
      WHERE h.account_id = ${firstAccount.account_id}
      ORDER BY h.market_value DESC NULLS LAST
      LIMIT 10
    `;

    return {
      accounts,
      holdings,
    };
  } catch (error) {
    console.error("Error getting client profile from database:", error);
    return null;
  }
}

export const searchClients = tool({
  description:
    "Search for clients by name, email, phone number, or account number. Returns matching clients with basic profile information and total assets.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "Search query - can be client name, email, phone, or account number"
      ),
    status: z
      .enum(["all", "active", "prospect", "inactive"])
      .optional()
      .default("all")
      .describe("Filter by client status"),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe("Maximum number of results to return"),
  }),
  execute: async ({ query, status, limit }) => {
    // Try real database first
    if (isClientsDbAvailable()) {
      const dbResults = await searchClientsInDb(query, limit);

      if (dbResults && dbResults.length > 0) {
        return {
          success: true,
          source: "database",
          message: `Found ${dbResults.length} client(s) matching "${query}"`,
          results: dbResults.map((client) => ({
            id: client.full_name, // Using full_name as identifier
            name: client.full_name?.trim() || `${client.first_name} ${client.last_name}`,
            firstName: client.first_name,
            lastName: client.last_name,
            status: "active",
            totalAUM: parseFloat(String(client.total_aum)) || 0,
            accountCount: parseInt(String(client.account_count)) || 0,
            accounts: client.accounts?.slice(0, 3) || [], // Show first 3 accounts
          })),
        };
      }
    }

    // Fallback to mock data
    const searchLower = query.toLowerCase();
    let results = mockClients.filter((client) => {
      const matchesQuery =
        client.firstName.toLowerCase().includes(searchLower) ||
        client.lastName.toLowerCase().includes(searchLower) ||
        `${client.firstName} ${client.lastName}`
          .toLowerCase()
          .includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        client.phone.includes(query);

      const matchesStatus = status === "all" || client.status === status;
      return matchesQuery && matchesStatus;
    });

    results = results.slice(0, limit);

    if (results.length === 0) {
      return {
        success: false,
        source: "mock",
        message: `No clients found matching "${query}"`,
        results: [],
      };
    }

    return {
      success: true,
      source: "mock",
      message: `Found ${results.length} client(s) matching "${query}"`,
      results: results.map((client) => ({
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        email: client.email,
        phone: client.phone,
        status: client.status,
        riskTolerance: client.riskTolerance,
        totalAUM: client.totalAUM,
        accountCount: client.accounts.length,
        lastContact: client.lastContactDate,
      })),
    };
  },
});

export const getClientProfile = tool({
  description:
    "Get detailed profile information for a specific client by their name or ID. Includes contact info, accounts, holdings, and portfolio details.",
  inputSchema: z.object({
    clientId: z.string().describe("The client name or unique client ID"),
  }),
  execute: async ({ clientId }) => {
    // Try real database first
    if (isClientsDbAvailable()) {
      const dbResult = await getClientProfileFromDb(clientId);

      if (dbResult && dbResult.accounts.length > 0) {
        const firstAccount = dbResult.accounts[0];
        const totalAUM = dbResult.accounts.reduce(
          (sum, acc) => sum + (parseFloat(String(acc.market_value)) || 0),
          0
        );
        const totalCostBasis = dbResult.accounts.reduce(
          (sum, acc) => sum + (parseFloat(String(acc.cost_basis)) || 0),
          0
        );
        const totalUnrealizedGL = dbResult.accounts.reduce(
          (sum, acc) => sum + (parseFloat(String(acc.unrealized_gain_loss)) || 0),
          0
        );

        return {
          success: true,
          source: "database",
          client: {
            id: firstAccount.full_name,
            name: firstAccount.full_name?.trim() || `${firstAccount.first_name} ${firstAccount.last_name}`,
            firstName: firstAccount.first_name,
            lastName: firstAccount.last_name,
            status: "active",
            totalAUM,
            totalCostBasis,
            unrealizedGainLoss: totalUnrealizedGL,
            unrealizedGainLossPercent: totalCostBasis > 0
              ? ((totalUnrealizedGL / totalCostBasis) * 100).toFixed(2) + "%"
              : "N/A",
            accounts: dbResult.accounts.map((acc) => ({
              id: acc.account_id,
              accountNumber: acc.account_number,
              name: acc.account_name,
              type: acc.account_type,
              value: parseFloat(String(acc.market_value)) || 0,
              costBasis: parseFloat(String(acc.cost_basis)) || 0,
              unrealizedGL: parseFloat(String(acc.unrealized_gain_loss)) || 0,
              custodian: acc.custodian,
              inceptionDate: acc.inception_date,
              isBillable: acc.is_billable,
              isDiscretionary: acc.is_discretionary,
            })),
            topHoldings: dbResult.holdings.map((h) => ({
              ticker: h.ticker,
              name: h.asset_name,
              assetClass: h.asset_class,
              units: parseFloat(String(h.units)) || 0,
              value: parseFloat(String(h.market_value)) || 0,
              costBasis: parseFloat(String(h.cost_basis)) || 0,
              unrealizedGL: parseFloat(String(h.unrealized_gain_loss)) || 0,
            })),
          },
        };
      }
    }

    // Fallback to mock data
    const client = mockClients.find(
      (c) => c.id === clientId ||
      `${c.firstName} ${c.lastName}`.toLowerCase() === clientId.toLowerCase()
    );

    if (!client) {
      return {
        success: false,
        error: `Client "${clientId}" not found`,
      };
    }

    return {
      success: true,
      source: "mock",
      client: {
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        status: client.status,
        riskTolerance: client.riskTolerance,
        investmentObjectives: ["Growth", "Income", "Capital Preservation"],
        totalAUM: client.totalAUM,
        accounts: client.accounts,
        onboardingDate: client.onboardingDate,
        lastContactDate: client.lastContactDate,
      },
    };
  },
});
