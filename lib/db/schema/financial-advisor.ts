import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  decimal,
  foreignKey,
  index,
  json,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
} from "drizzle-orm/pg-core";
import { user } from "../schema";

// Clients table - stores client information
export const client = pgTable("Client", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),

  // Basic info
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),

  // Status
  status: varchar("status", {
    enum: ["active", "prospect", "inactive", "closed"]
  }).notNull().default("prospect"),

  // Investment profile
  riskTolerance: varchar("riskTolerance", {
    enum: ["conservative", "moderately-conservative", "moderate", "moderately-aggressive", "aggressive"]
  }),
  investmentObjectives: json("investmentObjectives").$type<string[]>(),

  // Advisor relationship
  primaryAdvisorId: uuid("primaryAdvisorId").references(() => user.id),

  // Timestamps
  onboardingDate: timestamp("onboardingDate"),
  lastContactDate: timestamp("lastContactDate"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type Client = InferSelectModel<typeof client>;

// Client accounts (IRA, Brokerage, 401k, etc.)
export const clientAccount = pgTable("ClientAccount", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  clientId: uuid("clientId").notNull().references(() => client.id),

  accountType: varchar("accountType", {
    enum: ["ira", "roth-ira", "401k", "brokerage", "trust", "529", "other"]
  }).notNull(),
  accountNumber: varchar("accountNumber", { length: 50 }),
  custodian: varchar("custodian", { length: 100 }),

  // Values
  marketValue: decimal("marketValue", { precision: 15, scale: 2 }),
  costBasis: decimal("costBasis", { precision: 15, scale: 2 }),

  // Status
  isActive: boolean("isActive").notNull().default(true),

  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type ClientAccount = InferSelectModel<typeof clientAccount>;

// Holdings within accounts
export const holding = pgTable("Holding", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  accountId: uuid("accountId").notNull().references(() => clientAccount.id),

  symbol: varchar("symbol", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }),
  quantity: decimal("quantity", { precision: 15, scale: 4 }).notNull(),
  costBasis: decimal("costBasis", { precision: 15, scale: 2 }),
  marketValue: decimal("marketValue", { precision: 15, scale: 2 }),

  assetClass: varchar("assetClass", { length: 50 }),
  sector: varchar("sector", { length: 50 }),

  asOfDate: timestamp("asOfDate").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type Holding = InferSelectModel<typeof holding>;

// Client interactions (meetings, calls, emails)
export const clientInteraction = pgTable("ClientInteraction", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  clientId: uuid("clientId").notNull().references(() => client.id),
  advisorId: uuid("advisorId").notNull().references(() => user.id),

  type: varchar("type", {
    enum: ["meeting", "phone", "email", "video", "other"]
  }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  notes: text("notes"),

  interactionDate: timestamp("interactionDate").notNull(),
  duration: integer("duration"), // in minutes

  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type ClientInteraction = InferSelectModel<typeof clientInteraction>;

// Client documents (IPS, statements, etc.)
export const clientDocument = pgTable("ClientDocument", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  clientId: uuid("clientId").notNull().references(() => client.id),

  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", {
    enum: ["ips", "statement", "report", "agreement", "correspondence", "other"]
  }).notNull(),

  // File storage
  filePath: varchar("filePath", { length: 500 }),
  fileSize: integer("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),

  // For RAG
  content: text("content"),
  // embedding: vector("embedding", { dimensions: 1536 }), // Uncomment when pgvector is enabled

  uploadedBy: uuid("uploadedBy").references(() => user.id),
  documentDate: timestamp("documentDate"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type ClientDocument = InferSelectModel<typeof clientDocument>;

// Knowledge base articles (for RAG)
export const knowledgeBaseArticle = pgTable(
  "KnowledgeBaseArticle",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),

    title: varchar("title", { length: 255 }).notNull(),
    category: varchar("category", {
      enum: ["compliance", "investment-management", "financial-planning", "operations", "general"]
    }).notNull(),

    content: text("content").notNull(),
    // embedding: vector("embedding", { dimensions: 1536 }), // Uncomment when pgvector is enabled

    isPublished: boolean("isPublished").notNull().default(true),

    createdBy: uuid("createdBy").references(() => user.id),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index("kb_category_idx").on(table.category),
  })
);

export type KnowledgeBaseArticle = InferSelectModel<typeof knowledgeBaseArticle>;

// Performance data snapshots
export const performanceSnapshot = pgTable("PerformanceSnapshot", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  clientId: uuid("clientId").notNull().references(() => client.id),

  period: varchar("period", {
    enum: ["mtd", "qtd", "ytd", "1y", "3y", "5y", "10y", "itd"]
  }).notNull(),

  returnPercent: decimal("returnPercent", { precision: 8, scale: 4 }),
  benchmarkPercent: decimal("benchmarkPercent", { precision: 8, scale: 4 }),
  benchmarkName: varchar("benchmarkName", { length: 100 }),

  asOfDate: timestamp("asOfDate").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type PerformanceSnapshot = InferSelectModel<typeof performanceSnapshot>;
