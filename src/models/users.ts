import { sql } from "drizzle-orm"
import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

export const role = pgEnum('role', ['admin', 'user', 'headAdmin'])
export const users = pgTable("users", {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    name: text().notNull(),
    email: text().notNull().unique(),
    role: role(),
    division: text().notNull(),
    address: text().notNull(), 
    photo: text(),
    phoneNumber: text(),
    password: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`)
})

export const userSchema = {
    insert: createInsertSchema(users),
    select: createSelectSchema(users).extend({
        email: z.string({ description: "Email user" }).email()
    })
}
