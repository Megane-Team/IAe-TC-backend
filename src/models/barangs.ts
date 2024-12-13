import { sql } from "drizzle-orm";
import { boolean, date, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { ruangans } from "./ruangans.ts";

export const barangs = pgTable("barangs", {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    name: text().notNull(),
    code: text().notNull(),
    status: boolean().notNull().default(false),
    condition: text().notNull(),
    warranty: date().notNull(),
    photo: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
    ruanganId: integer().notNull().references(() => ruangans.id)
})

export const barangSchema = {
    insert: createInsertSchema(barangs),
    select: createSelectSchema(barangs)
}
