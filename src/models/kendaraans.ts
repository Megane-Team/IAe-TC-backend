import { sql } from "drizzle-orm";
import { boolean, date, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { tempats } from "./tempat.ts";

export const kendaraanCategory = pgEnum('kcategory', ['mobil', 'motor', 'truk'])
export const kendaraans = pgTable("kendaraans", {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    name: text().notNull(),
    plat: text().notNull().unique(),
    status: boolean().notNull().default(false),
    condition: text().notNull(),
    warranty: date().notNull(),
    capacity: integer().notNull(),  
    category: kendaraanCategory(),
    color: text().notNull(),
    photo: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
    tempatId: integer().notNull().references(() => tempats.id)
})

export const kendaraanSchema = {
    insert: createInsertSchema(kendaraans),
    select: createSelectSchema(kendaraans)
}
