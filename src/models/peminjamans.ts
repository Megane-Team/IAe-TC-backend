import { sql } from "drizzle-orm";
import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users.ts";
import { ruangans } from "./ruangans.ts";
import { barangs } from "./barangs.ts";
import { kendaraans } from "./kendaraans.ts";

export const peminjamanCategory = pgEnum('pcategory', ['barang', 'kendaraan', 'ruangan'])
export const status = pgEnum('status', ['draft', 'pending', 'approved', 'rejected'])
export const peminjamans = pgTable("peminjamans", {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    status: status().notNull(),
    category: peminjamanCategory(),
    borrowedDate: timestamp({ withTimezone: true }).notNull(),
    estimatedTime: timestamp({ withTimezone: true }).notNull(),
    returnDate: timestamp({ withTimezone: true }),
    objective: text().notNull(),
    destination: text(),
    passenger: integer(),
    userId: integer().notNull().references(() => users.id),
    ruanganId: integer().references(() => ruangans.id),
    barangId: integer().references(() => barangs.id),
    kendaraanId: integer().references(() => kendaraans.id),
    createdAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`)
})

export const peminjamanSchema = {
    insert: createInsertSchema(peminjamans),
    select: createSelectSchema(peminjamans)
}
