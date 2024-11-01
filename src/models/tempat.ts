import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { ruangans } from "./ruangans.js";
import { kendaraans } from "./kendaraans.js";

export const tempats = pgTable("tempats", {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    name: text().notNull().unique(),
    category: text().notNull(),
    photo: text().notNull(),
    created_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
    id_ruangan: integer().references(() => ruangans.id),
    id_kendaraan: integer().references(() => kendaraans.id)
})
