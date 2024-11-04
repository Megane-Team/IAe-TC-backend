import { sql } from "drizzle-orm"
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"

export const users = pgTable("users", {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    name: text().notNull(),
    email: text().notNull().unique(),
    role: text().notNull(),
    division: text().notNull(),
    place: text().notNull(),
    address: text().notNull(), 
    photo: text(),
    phoneNumber: text().notNull(),
    password: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`)
})

export const userSchema = {
    insert: createInsertSchema(users),
    select: createSelectSchema(users)
}
