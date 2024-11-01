import { relations, sql } from "drizzle-orm"
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { logs } from "./logs.js"

export const users = pgTable("users", {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    name: text().notNull(),
    email: text().notNull().unique(),
    role: text().notNull(),
    division: text().notNull(),
    place: text().notNull(),
    address: text().notNull(), 
    photo: text(),
    phone_number: text().notNull(),
    password: text().notNull(),
    created_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`)
})

export const usersRelation = relations(users, ({ one }) => ({
    logs: one(logs)
}))
 

export const userSchema = {
    insert: createInsertSchema(users),
    select: createSelectSchema(users)
}
