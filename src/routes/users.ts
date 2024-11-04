import { genericResponse } from "@/constants.ts";
import { server } from "@/index.ts";
import { users } from "@/models/users.ts";
import { db } from "@/modules/database.ts";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcrypt";
import { create } from "domain";

const SALT_ROUNDS = 10;

export const prefix = "/users";

export const route = (instance: typeof server) => { instance
    .post("/login", {
        schema: {
            description: "Login user",
            tags: ["login"],
            body: z.object({
                email: z.string(),
                password: z.string().min(8)
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

        const user = await db.select().from(users).where(eq(users.email, email)).execute();
        const result = await bcrypt.compare(password, user[0].password);

        if (user.length === 0) {
            return {
                statusCode: 401,
                message: "Unauthorized"
            };
        }

        if (!result) {
            return {
                statusCode: 401,
                message: "Unauthorized"
            };
        }

        const token = req.jwt.sign({ id: user[0].id, name: user[0].name, email: user[0].email}); 

        return {
            statusCode: 200,
            message: "Success",
            token
        };
    })
    .post("/register", {
        schema: {
            description: "Register user",
            tags: ["register"],
            body: z.object({
                name: z.string(),
                email: z.string(),
                role: z.string(),
                division: z.string(),
                place: z.string(),
                phone_number: z.string(),
                address: z.string(),
                password: z.string().min(8),
                photo: z.string(),
                createdAt: z.date(),
            }),
            response: {
                200: genericResponse(200),
                400: genericResponse(400)
            }
        }
    }, async (req) => {

        const { name, email, password, role, division, place, phone_number, address, photo, createdAt } = req.body as { name: string; email: string; password: string; role: string; division: string; place: string; phone_number: string; address: string; photo: string; createdAt: Date };

        const user = await db.select().from(users).where(eq(users.email, email)).execute();

        if (user.length > 0) {
            return {
                statusCode: 400,
                message: "Email already registered"
            };
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        await db.insert(users).values({
            name: name,
            email: email,
            password: hashedPassword,
            role: role,
            division: division,
            place: place,
            address: address,
            phone_number: phone_number,
            photo: photo,
            createdAt: new Date()
        }).execute();

        return {
            statusCode: 200,
            message: "Success"
        };
    })
    
}
