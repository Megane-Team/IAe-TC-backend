import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { users } from "./users.ts";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const perangkats = pgTable('perangkats', {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    deviceToken: text().notNull().unique(),
    userId: integer().notNull().references(() => users.id),
})

export const perangkatSchema = {
    insert: createInsertSchema(perangkats),
    select: createSelectSchema(perangkats)
}
