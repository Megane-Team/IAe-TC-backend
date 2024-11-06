import { genericResponse } from "@/constants.ts";
import { server } from "@/index.ts";
import { users, userSchema } from "@/models/users.ts";
import { db } from "@/modules/database.ts";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcrypt";
import { logs } from "@/models/logs.ts";
        
const SALT_ROUNDS = 10;

export const prefix = "/users";
export const route = (instance: typeof server) => { instance
    .post("/login", {
        schema: {
            description: "Login user",
            tags: ["login"],
            body: userSchema.select.pick({ email: true, password: true }),
            response: {
                // return token
                200: genericResponse(200).merge(z.object({
                    token: z.string()
                })),
                401: genericResponse(401),
                404: genericResponse(404)
            }
        },
    }, async (req) => {
        const { email, password } = req.body;

        const user = await db.select().from(users).where(eq(users.email, email)).execute();

        if (user.length === 0) {
            return {
                statusCode: 401,
                message: "Unauthorized"
            }; 
        }

        const result = await bcrypt.compare(password, user[0].password);

        if (!result) {
            return {
                statusCode: 401,
                message: "Unauthorized"
            };
        }

        const token = req.jwt.sign({ id: user[0].id }); 

        // make a logs
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

        const { name, email, password, role, division, place, phoneNumber, address, photo} = req.body;

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
