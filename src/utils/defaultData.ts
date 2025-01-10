import { defaultPassword } from "@/config.ts";
import { users } from "@/models/users.ts";
import { db } from "@/modules/database.ts";
import argon2 from "argon2";

export async function checkAndInsertDefaultUser() {
    const hash = await argon2.hash(defaultPassword as any);

    const result = await db.select().from(users)

    if (result.length === 0) {
        await db.insert(users).values({
            name: "User",
            nik: "123456789010112",
            email: "user@gmail.com",
            role: "user",
            unit: "HC 3000",
            address: "Jl. Pegangsaan Timur No.56",
            phoneNumber: "123456789",
            photo: "admin",
            password: hash,
            createdAt: new Date(),
        });
        await db.insert(users).values({
            name: "Admin",
            nik: "123456789010111",
            email: "admin@gmail.com",
            role: "admin",
            unit: "HC 3000",
            address: "Jl. Pegangsaan Timur No.56",
            phoneNumber: "123456789",
            photo: "admin",
            password: hash,
            createdAt: new Date(),
        });
        await db.insert(users).values({
            name: "Head Office",
            nik: "123456789010113",
            email: "headOffice@gmail.com",
            role: "headOffice",
            unit: "HC 3000",
            address: "Jl. Pegangsaan Timur No.56",
            phoneNumber: "123456789",
            photo: "admin",
            password: hash,
            createdAt: new Date(),
        });

        return true;
    }

    return false;
}
