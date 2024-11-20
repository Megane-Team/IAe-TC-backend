import { sql } from "drizzle-orm";
import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { tempats } from "./tempat.ts";

export const ruanganCategory = pgEnum('rcategory', ['kelas', 'lab', 'gudang'])
export const ruangans = pgTable("ruangans", {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    code: text().notNull().unique(),
    status: text().notNull(),
    capacity: integer(),
    category: ruanganCategory(),
    photo: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
    tempatId: integer().notNull().references(() => tempats.id),
})

export const ruanganSchema = {
    insert: createInsertSchema(ruangans),
    select: createSelectSchema(ruangans)
}
