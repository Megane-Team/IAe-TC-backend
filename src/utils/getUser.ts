import { server } from "@/index.ts";
import { users } from "@/models/users.ts";
import { db } from "@/modules/database.ts";
import { eq } from "drizzle-orm";

export const getUser = (token: string, instance: typeof server) => {
    const { id } = instance.jwt.verify<{ id:number }>(token);

    return db.select().from(users).where(eq(users.id, id)).execute().then((res) => res.at(0));
}
