import { genericResponse } from "@/constants.ts";
import { server } from "@/index.ts";
import { users } from "@/models/users.ts";
import { db } from "@/modules/database.ts";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const prefix = "/login";

export const route = (instance: typeof server) => { instance
    .post("", {
        schema: {
            description: "Login user",
            tags: ["login"],
            body: z.object({
                email: z.string(),
                password: z.string()
            }),
            response: {
                // return token
                200: genericResponse(200).merge(z.object({
                    token: z.string()
                })),
                401: genericResponse(401)
            }
        },
    }, async (req) => {
        const { email, password } = req.body as { email: string; password: string };

        const user = db.select().from(users);

        console.log(user.toSQL())

        if (user.length === 0) {
            return {
                statusCode: 401,
                message: "Unauthorized"
            };
        }

        const token = req.jwt.sign({ id: user.id, email: user.email });

        return {
            statusCode: 200,
            message: "Success",
            token
        };
    })
    
}
