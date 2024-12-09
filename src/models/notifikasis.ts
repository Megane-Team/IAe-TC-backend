import { boolean, integer, pgEnum, pgTable, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.ts";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { detailPeminjamans } from "./detailPeminjamans.ts";

export const notifikasiCategory = pgEnum('ncategory', ['PB', 'PD', 'PG', 'PDB', 'PDT', 'JT', 'DO', 'PP'])
export const notifikasis = pgTable("notifikasis", {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    category: notifikasiCategory(),
    isRead: boolean().notNull().default(false),
    userId: integer().notNull().references(() => users.id),
    detailPeminjamanId: integer().notNull().references(() => detailPeminjamans.id),
    createdAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`)
})

export const notifikasiSchema = {
    insert: createInsertSchema(notifikasis),
    select: createSelectSchema(notifikasis)
}
