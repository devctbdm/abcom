import {
  pgTable,
  pgEnum,
  serial,
  integer,
  numeric,
  date,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/** Only two roles. Change a user's role directly in the database. */
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserRow = typeof users.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PasswordResetTokenRow = typeof passwordResetTokens.$inferSelect;

export const fiberClients = pgTable("fiber_clients", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull().unique(), // e.g. razzak@ptap
  name: text("name").notNull().default(""),
  zone: text("zone"), // e.g. ptap / jbnr (part after @)
  phone: text("phone"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fiberPurchases = pgTable("fiber_purchases", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  brand: text("brand").notNull(), // e.g. Leo
  core: integer("core").notNull().default(2), // e.g. 2-core
  code: text("code").notNull().default("FTTH"), // e.g. FTTH / ADSS
  lengthM: numeric("length_m", { precision: 10, scale: 2 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }), // taka paid
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fiberUsages = pgTable("fiber_usages", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .notNull()
    .references(() => fiberClients.id, { onDelete: "cascade" }),
  purchaseId: integer("purchase_id").references(() => fiberPurchases.id, {
    onDelete: "set null",
  }),
  date: date("date").notNull(),
  meters: numeric("meters", { precision: 10, scale: 2 }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  position: text("position").notNull(),
  phone: text("phone"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("BIKE"), // BIKE | CAR
  regNo: text("reg_no").notNull(),
  fuelType: text("fuel_type").notNull().default("Petrol"),
  oilIntervalKm: integer("oil_interval_km").notNull().default(1200),
  /** Employee who owns / rides this vehicle. */
  ownerId: integer("owner_id").references(() => staff.id, {
    onDelete: "set null",
  }),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fuelLogs = pgTable("fuel_logs", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  date: date("date").notNull(), // YYYY-MM-DD — day of the refill
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(), // taka spent
  liters: numeric("liters", { precision: 8, scale: 3 }).notNull(), // litres loaded
  odometer: numeric("odometer", { precision: 10, scale: 1 }).notNull(), // vehicle km reading at refill
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const oilChanges = pgTable("oil_changes", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  odometer: integer("odometer").notNull(), // km reading at oil drain
  oilName: text("oil_name").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }), // taka spent
  quantity: numeric("quantity", { precision: 8, scale: 3 }), // oil litres drained in
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type FiberClientRow = typeof fiberClients.$inferSelect;
export type FiberPurchaseRow = typeof fiberPurchases.$inferSelect;
export type FiberUsageRow = typeof fiberUsages.$inferSelect;
export type StaffRow = typeof staff.$inferSelect;
export type VehicleRow = typeof vehicles.$inferSelect;
export type FuelLogRow = typeof fuelLogs.$inferSelect;
export type OilChangeRow = typeof oilChanges.$inferSelect;

export const VEHICLE_CATEGORIES = ["BIKE", "CAR"] as const;
export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];
