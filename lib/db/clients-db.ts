import postgres from "postgres";

// Connection to the clients database (separate Supabase project)
const clientsDbUrl = process.env.CLIENTS_DB_URL;

if (!clientsDbUrl) {
  console.warn("CLIENTS_DB_URL not set - client search will use mock data");
}

export const clientsDb = clientsDbUrl
  ? postgres(clientsDbUrl, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  : null;

// Helper to check if clients DB is available
export function isClientsDbAvailable(): boolean {
  return clientsDb !== null;
}
