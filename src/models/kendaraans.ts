import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const kendaraans = pgTable("kendaraans", {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    name: text().notNull(),
    plat: text().notNull().unique(),
    status: text().notNull(),
    condition: text().notNull(),
    warranty: text().notNull(),
    category: text().notNull(),
    color: text().notNull(),
    photo: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`)
})

export const kendaraanSchema = {
    insert: createInsertSchema(kendaraans),
    select: createSelectSchema(kendaraans)
}
