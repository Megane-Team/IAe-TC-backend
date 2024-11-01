import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { barangs } from "./barangs.js";

export const ruangans = pgTable("ruangans", {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    code: text().notNull().unique(),
    status: text().notNull(),
    capacity: integer().notNull(),
    category: text().notNull(),
    photo: text(),
    created_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
    id_barang: integer().notNull().references(() => barangs.id)
})

export const ruanganSchema = {
    insert: createInsertSchema(ruangans),
    select: createSelectSchema(ruangans)
}
