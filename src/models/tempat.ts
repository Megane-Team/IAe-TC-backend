import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const tempats = pgTable("tempats", {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    name: text().notNull().unique(),
    category: text().notNull(),
    photo: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`)
})

export const tempatSchema = {
    insert: createInsertSchema(tempats),
    select: createSelectSchema(tempats)
}
