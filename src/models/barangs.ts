import { sql } from "drizzle-orm";
import { date, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const barangs = pgTable("barangs", {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    name: text().notNull(),
    code: text().notNull(),
    status: text().notNull(),
    condition: text().notNull(),
    warranty: date().notNull(),
    photo: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`)
})

export const barangSchema = {
    insert: createInsertSchema(barangs),
    select: createSelectSchema(barangs)
}
