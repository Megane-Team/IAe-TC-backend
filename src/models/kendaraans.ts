import { sql } from "drizzle-orm";
import { date, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { tempats } from "./tempat.ts";

export const kendaraans = pgTable("kendaraans", {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    name: text().notNull(),
    plat: text().notNull().unique(),
    status: text().notNull(),
    condition: text().notNull(),
    warranty: date().notNull(),
    capacity: integer().notNull(),
    category: text().notNull(),
    color: text().notNull(),
    photo: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
    tempatId: integer().notNull().references(() => tempats.id)
})

export const kendaraanSchema = {
    insert: createInsertSchema(kendaraans),
    select: createSelectSchema(kendaraans)
}
