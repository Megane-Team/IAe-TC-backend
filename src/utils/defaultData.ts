import { defaultPassword } from "@/config.ts";
import { users } from "@/models/users.ts";
import { db } from "@/modules/database.ts";
import argon2 from "argon2";

export async function checkAndInsertDefaultUser() {
    const hash = await argon2.hash(defaultPassword as any);

    const result = await db.select().from(users)

    if (result.length === 0) {
        await db.insert(users).values({
            name: "Admin",
            email: "example@gmail.com",
            role: "admin",
            unit: "admin",
            address: "admin",
            phoneNumber: "123456789",
            photo: "admin",
            password: hash,
            createdAt: new Date(),
        });

        return true;
    }

    return false;
}
