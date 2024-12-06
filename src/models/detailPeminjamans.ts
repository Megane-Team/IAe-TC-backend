import { sql } from "drizzle-orm";
import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users.ts";

export const status = pgEnum('status', ['draft', 'pending', 'approved', 'rejected', 'returned', 'canceled'])
export const detailPeminjamans = pgTable("detailPeminjamans", {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    status: status().notNull(),
    borrowedDate: timestamp({ withTimezone: true }),
    estimatedTime: timestamp({ withTimezone: true }),   
    returnDate: timestamp({ withTimezone: true }),
    objective: text(),
    destination: text(),
    passenger: integer(),   
    userId: integer().notNull().references(() => users.id),
    createdAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`)
})

export const detailPeminjamanSchema = {
    insert: createInsertSchema(detailPeminjamans),
    select: createSelectSchema(detailPeminjamans)
}
