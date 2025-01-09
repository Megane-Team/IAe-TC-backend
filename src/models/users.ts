import { sql } from "drizzle-orm"
import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

export const role = pgEnum('role', ['admin', 'user', 'headOffice'])
export const users = pgTable("users", {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    name: text().notNull(),
    nik: text().notNull(),
    email: text().unique(),
    role: role(),
    unit: text().notNull(),
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
