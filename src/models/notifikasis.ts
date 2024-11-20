import { boolean, integer, pgEnum, pgTable } from "drizzle-orm/pg-core";
import { users } from "./users.ts";

export const notifikasiCategory = pgEnum('ncategory', ['PB', 'DK', 'PG', 'PDB', 'PDT', 'JT', 'DO', 'PP'])
export const notifikasis = pgTable("notifikasis", {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    category: notifikasiCategory(),
    isRead: boolean().notNull().default(false),
    userId: integer().notNull().references(() => users.id),
})
