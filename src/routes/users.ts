import { genericResponse } from "@/constants.ts";
import { server } from "@/index.ts";
import { users, userSchema } from "@/models/users.ts";
import { db } from "@/modules/database.ts";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { logs } from "@/models/logs.ts";
import { getUser } from "@/utils/getUser.ts";
import argon2 from "argon2";
import { perangkats } from "@/models/perangkat.ts";
        
export const prefix = "/users";
export const route = (instance: typeof server) => { instance
    .get("/", {
        schema: {
            description: "Get user by id",
            tags: ["users"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: userSchema.select.omit({ password: true })
                })),
                401: genericResponse(401)
            }
        }
    }, async (req) => {
        const actor = await getUser(req.headers["authorization"], instance);

        if (!actor) {
            return {
                statusCode: 401,
                message: "Unauthorized"
            };
        }

        return {
            statusCode: 200,
            message: "Success",
            data: actor
        };
    })
    .post("/login", {
        schema: {
            description: "Login user",
            tags: ["login"],
            body: userSchema.select.pick({ email: true, password: true }).merge(z.object({
                deviceToken: z.string()
            })),
            response: {
                // return token
                200: genericResponse(200).merge(z.object({
                    token: z.string()
                })),
                401: genericResponse(401),
            }
        },
    }, async (req) => {
        const { email, password, deviceToken } = req.body;

        const user = await db.select().from(users).where(eq(users.email, email)).execute();

        if (user.length === 0) {
            return {
                statusCode: 401,
                message: "Unauthorized"
            }; 
        }

        const result = await argon2.verify(user[0].password, password);

        if (!result) {
            return {
                statusCode: 401,
                message: "Unauthorized"
            };
        }

        const token = req.jwt.sign({ id: user[0].id }); 

        const perangkat = await db.select().from(perangkats).where(eq(perangkats.deviceToken, deviceToken))
        
        if (perangkat.length === 0) {
            await db.insert(perangkats).values({
                deviceToken: deviceToken,
                userId: user[0].id
            })
        }

        if (perangkat[0].id !== user[0].id) {
            await db.update(perangkats).set({
                userId: user[0].id
            }).where(eq(perangkats.deviceToken, deviceToken)).execute();    
        }

        await db.insert(logs).values({
            userId: user[0].id,
            action: "login",
            createdAt: new Date()
        }).execute();

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
            body: userSchema.insert.omit({ createdAt: true, id: true }),
            response: {
                200: genericResponse(200),
                400: genericResponse(400)
            }
        }
    }, async (req) => {

        const { name, email, password, role, unit, phoneNumber, address, photo} = req.body;

        const user = await db.select().from(users).where(eq(users.email, email!)).execute();

        if (user.length > 0) {
            return {
                statusCode: 400,
                message: "Email already registered"
            };
        }

        const hashedPassword = await argon2.hash(password);

        await db.insert(users).values({
            name: name,
            email: email,
            password: hashedPassword,
            role: role,
            unit: unit,
            address: address,
            phoneNumber: phoneNumber,
            photo: photo,
            createdAt: new Date()
        }).execute();

        return {
            statusCode: 200,
            message: "Success"
        };
    })
}
