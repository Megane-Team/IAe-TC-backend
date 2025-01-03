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
import { authorizeUser } from "@/utils/preHandlers.ts";
import path from "path";
import fs from "fs";
        
export const prefix = "/users";
export const route = (instance: typeof server) => { instance
    .get("/", {
        schema: {
            description: "Get user by token",
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
    .get("/:id", {
        schema: {
            description: "Get user by id",
            tags: ["users"],
            params: z.object({
                id: z.string()
            }),
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: userSchema.select.omit({ password: true })
                })),
                400: genericResponse(400),
                401: genericResponse(401),
                404: genericResponse(404)
            }
        },
        preHandler: authorizeUser
    }, async (req) => {
        const { id } = req.params;
        const numId = parseInt(id);

        if (!numId) {
            return {
                statusCode: 400,
                message: "Bad request"
            };
        }

        const user = await db.select().from(users).where(eq(users.id, numId)).execute();

        if (user.length === 0) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        return {
            statusCode: 200,
            message: "Success",
            data: user[0]
        };
    })
    .post("/login", {
        schema: {
            description: "Login user",
            tags: ["users"],
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

        const user = await db.select()
            .from(users)
            .where(eq(users.email, email))
            .execute();

        if (user.length === 0) {
            return {
                statusCode: 401,
                message: "Unauthorized"
            }; 
        }

        const validPassword = await argon2.verify(user[0].password, password);

        if (!validPassword) {
            return {
                statusCode: 401,
                message: "Unauthorized"
            };
        }
        const token = req.jwt.sign({ id: user[0].id }); 
        
        const perangkat = await db.select()
            .from(perangkats)
            .where(eq(perangkats.deviceToken, deviceToken))
            .execute();
        
        if (perangkat.length === 0) {
            await db.insert(perangkats).values({
                deviceToken: deviceToken,
                userId: user[0].id
            }).execute();
        } else if (perangkat[0].userId !== user[0].id) {
            await db.update(perangkats).set({
                userId: user[0].id
            }).where(eq(perangkats.deviceToken, deviceToken)).execute();
        }

        await db.insert(logs).values({
            userId: user[0].id,
            action: "login",
            createdAt: new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
        }).execute();

        return {
            statusCode: 200,
            message: "Success",
            token
        };
    })
    .post("/", {
        schema: {
            description: "Create a new user",
            tags: ["users"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200),
                400: genericResponse(400),
                401: genericResponse(401)
            }
        },
        preHandler: authorizeUser
    }, async (req) => {
        const parts = req.parts();
        const fields: Record<string, any> = {};
        let photoPath: string = "";

        for await (const part of parts) {
            if (part.type === 'field') {
                fields[part.fieldname] = part.value;
            } else if (part.type === 'file' && part.fieldname === 'image') {
                const extension = path.extname(part.filename);
                const newFileName = `${fields.name}${extension}`;
                const uploadPath = path.join(import.meta.dirname, '../public/assets/user/', newFileName);
                const writeStream = fs.createWriteStream(uploadPath);
                part.file.pipe(writeStream);
                photoPath = uploadPath;
            }
        }

        if (!fields.name || !photoPath) {
            return {
            message: "Name or file not provided",
            statusCode: 400
            }
        }

        const hashedPassword = await argon2.hash(fields.password);

        await db.insert(users).values({
            name: String(fields.name),
            email: String(fields.email),
            role: fields.role as "admin" || "user" || "headOffice",
            unit: String(fields.unit),
            address: String(fields.address),
            password: hashedPassword,
            photo: String(fields.name),
            phoneNumber: String(fields.phoneNumber),
            createdAt: new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
        }).execute();

        return {
            statusCode: 200,
            message: "User created successfully"
        };
    })
    .put("/:id", {
        schema: {
            description: "Update a user",
            tags: ["users"],
            params: z.object({
                id: z.string()
            }),
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200),
                400: genericResponse(400),
                401: genericResponse(401),
                404: genericResponse(404)
            }
        },
        preHandler: authorizeUser
    }, async (req) => {
        const { id } = req.params;
        const numId = parseInt(id);

        if (!numId) {
            return {
                statusCode: 400,
                message: "Bad request"
            };
        }

        const parts = req.parts();
        const fields: Record<string, any> = {};
        let photoPath: string = "";

        for await (const part of parts) {
            if (part.type === 'field') {
                fields[part.fieldname] = part.value;
            } else if (part.type === 'file' && part.fieldname === 'image') {
                const extension = path.extname(part.filename);
                const newFileName = `${fields.name}${extension}`;
                const uploadPath = path.join(import.meta.dirname, '../public/assets/user/', newFileName);
                const writeStream = fs.createWriteStream(uploadPath);
                part.file.pipe(writeStream);
                photoPath = uploadPath;
            }
        }

        if (!fields.name) {
            return {
                message: "Name not provided",
                statusCode: 400
            }
        }

        const user = await db.select().from(users).where(eq(users.id, numId)).execute();

        if (user.length === 0) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        const updateData: Record<string, any> = {
            name: String(fields.name),
            email: String(fields.email),
            role: fields.role as "admin" || "user" || "headOffice",
            unit: String(fields.unit),
            address: String(fields.address),
            phoneNumber: String(fields.phoneNumber),
            updatedAt: new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
        };

        if (fields.password) {
            updateData.password = await argon2.hash(fields.password);
        }

        if (photoPath) {
            updateData.photo = String(fields.name);
        }

        await db.update(users).set(updateData).where(eq(users.id, numId)).execute();

        return {
            statusCode: 200,
            message: "User updated successfully"
        };
    })
    .delete("/:id", {
        schema: {
            description: "Delete a user by id",
            tags: ["users"],
            params: z.object({
                id: z.string()
            }),
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200),
                400: genericResponse(400),
                401: genericResponse(401),
                404: genericResponse(404)
            }
        },
        preHandler: authorizeUser
    }, async (req) => {
        const { id } = req.params;
        const numId = parseInt(id);

        if (!numId) {
            return {
                statusCode: 400,
                message: "Bad request"
            };
        }

        const user = await db.select().from(users).where(eq(users.id, numId)).execute();

        if (user.length === 0) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        const photoPath = path.join(import.meta.dirname, '../public/assets/user/', `${user[0].photo}.png`);
        if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
        }

        await db.delete(users).where(eq(users.id, numId)).execute();

        return {
            statusCode: 200,
            message: "User deleted successfully"
        };
    })
}
