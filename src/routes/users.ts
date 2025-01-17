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
            } else if (part.type === 'file' && part.fieldname === 'photo') {
                const extension = path.extname(part.filename);
                const newFileName = `${fields.nik}${extension}`;
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
            name: fields.name,
            email: fields.email,
            nik: fields.nik,
            role: fields.role as "admin" || "user" || "headOffice",
            unit: fields.unit,
            address: fields.address,
            password: hashedPassword,
            photo: fields.name,
            phoneNumber: fields.phoneNumber,
            createdAt: new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
        }).execute();

        return {
            statusCode: 200,
            message: "User created successfully"
        };
    })
    .put("/:nik", {
        schema: {
            description: "Update a user",
            tags: ["users"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            params: z.object({
                nik: z.string()
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
        const parts = req.parts();
        const fields: Record<string, any> = {};
        const { nik } = req.params;
        let photoPath: string = "";

        for await (const part of parts) {
            if (part.type === 'field') {
                fields[part.fieldname] = part.value;
            } else if (part.type === 'file' && part.fieldname === 'photo') {
                const extension = path.extname(part.filename);
                const newFileName = `${fields.nik}${extension}`;
                const uploadPath = path.join(import.meta.dirname, '../public/assets/user/', newFileName);
                const writeStream = fs.createWriteStream(uploadPath);
                part.file.pipe(writeStream);
                photoPath = uploadPath;
            }
        }

        const user = await db.select().from(users).where(eq(users.nik, nik)).execute();

        if (user.length === 0) {
            return {
                statusCode: 404,
                message: "User not found"
            };
        }

        if (typeof fields.nik === 'string' && fields.nik !== user[0].nik) {
            const oldPhotoPath = path.join(import.meta.dirname, '../public/assets/user/', `${user[0].photo}.png`);
            const newPhotoPath = path.join(import.meta.dirname, '../public/assets/user/', `${fields.nik}.png`);
            if (fs.existsSync(oldPhotoPath)) {
                await fs.promises.rename(oldPhotoPath, newPhotoPath);
            }
        }

        const hashedPassword = fields.password ? await argon2.hash(fields.password) : user[0].password;

        await db.update(users)
            .set({
                name: fields.name || user[0].name,
                email: fields.email || user[0].email,
                nik: fields.nik || user[0].nik,
                role: fields.role || user[0].role,
                unit: fields.unit || user[0].unit,
                address: fields.address || user[0].address,
                password: hashedPassword,
                photo: fields.name || user[0].photo,
                phoneNumber: fields.phoneNumber || user[0].phoneNumber
            })
            .where(eq(users.nik, nik))
            .execute();

        return {
            statusCode: 200,
            message: "User updated successfully"
        };
    })
    .delete("/:nik", {
        schema: {
            description: "Delete a user by NIK",
            tags: ["users"],
            params: z.object({
                nik: z.string()
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
        const { nik } = req.params;

        if (!nik) {
            return {
                statusCode: 400,
                message: "Bad request"
            };
        }

        const user = await db.select().from(users).where(eq(users.nik, nik)).execute();

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

        await db.delete(users).where(eq(users.nik, nik)).execute();

        return {
            statusCode: 200,
            message: "User deleted successfully"
        };
    })
    .delete("/bulk", {
        schema: {
            description: "Delete multiple users by NIK",
            tags: ["users"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            body: z.object({
                niks: z.array(z.string())
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
        const { niks } = req.body;

        if (!niks || niks.length === 0) {
            return {
                statusCode: 400,
                message: "Bad request"
            };
        }

        for (const nik of niks) {
            if (!nik) {
                return {
                    statusCode: 400,
                    message: "Bad request"
                };
            }

            const userToDelete = await db
                .select()
                .from(users)
                .where(eq(users.nik, nik)).execute().then((res) => res[0]);

            if (!userToDelete) {
                return {
                    statusCode: 404,
                    message: "Not found"
                };
            }

            await db
                .delete(logs)
                .where(eq(logs.userId, userToDelete.id)).execute();

            await db
                .delete(perangkats)
                .where(eq(perangkats.userId, userToDelete.id)).execute();

            const photoPath = path.join(import.meta.dirname, '../public/assets/user/', `${userToDelete.photo}.png`);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }

            await db.delete(users).where(eq(users.nik, nik)).execute();
        }

        return {
            statusCode: 200,
            message: "Users deleted successfully"
        };
    })
}
