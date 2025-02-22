import { sql } from "drizzle-orm"
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { users } from "./users.ts"

export const logs = pgTable("logs", {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    userId: integer("").notNull().references(() => users.id),
    action: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`)
})

export const logSchema = {
    insert: createInsertSchema(logs),
    select: createSelectSchema(logs)
}
