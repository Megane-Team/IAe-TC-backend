import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { ruangans } from "./ruangans.ts";
import { kendaraans } from "./kendaraans.ts";

export const tempats = pgTable("tempats", {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    name: text().notNull().unique(),
    category: text().notNull(),
    photo: text(),
    ruanganId: integer().references(() => ruangans.id),
    kendaraanId: integer().references(() => kendaraans.id),
    createdAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`)
})
