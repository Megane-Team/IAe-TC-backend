import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users.js";
import { ruangans } from "./ruangans.js";
import { barangs } from "./barangs.js";
import { kendaraans } from "./kendaraans.js";

export const peminjamans = pgTable("peminjamans", {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    status: text().notNull(),
    category: text().notNull(),
    borrowedDate: timestamp({ withTimezone: true }).notNull(),
    estimatedTime: timestamp({ withTimezone: true }).notNull(),
    returnDate: timestamp({ withTimezone: true }).notNull(),
    objective: text().notNull(),
    passenger: integer().notNull(),
    created_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
    userId: integer().notNull().references(() => users.id),
    ruanganId: integer().notNull().references(() => ruangans.id),
    barangId: integer().notNull().references(() => barangs.id),
    kendaraanId: integer().notNull().references(() => kendaraans.id)
})

export const peminjamanSchema = {
    insert: createInsertSchema(peminjamans),
    select: createSelectSchema(peminjamans)
}
