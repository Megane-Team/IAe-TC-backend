import { genericResponse } from "@/constants.ts"
import { server } from "@/index.ts"
import { barangs, barangSchema } from "@/models/barangs.ts"
import { db } from "@/modules/database.ts"
import { getUser } from "@/utils/getUser.ts"
import { eq } from "drizzle-orm"
import path from "path"
import { z } from "zod"
import fs from 'fs';
import { authorizeUser } from "@/utils/preHandlers.ts"

export const prefix = "/barangs"
export const route = (instance: typeof server) => instance
    .get("/", {
        schema: {
            description: "get all the barang data",
            tags: ["barangs"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: z.array(barangSchema.select.omit({ createdAt: true }))
                })),
                401: genericResponse(401)
            }
        },
        preHandler: authorizeUser
    }, async () => {
        const res = await db
            .select()
            .from(barangs)
            .execute();

        return {
            statusCode: 200,
            message: "Success",
            data: res
        }
    })
    .get("/:id", {
        schema: {
            description: "get the barang data by id",
            tags: ["barangs"],
            params: z.object({
                id: z.string(),
            }),
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: barangSchema.select.omit({ createdAt: true })
                })),
                401: genericResponse(401)
            }
        },
        preHandler: authorizeUser
    }, async (req) => {
        const { id } = req.params
        const numberId = Number(id);

        const res = await db
            .select()
            .from(barangs)
            .where(eq(barangs.id, numberId))
            .execute();

        return {
            statusCode: 200,
            message: "Success",
            data: res[0]
        }
    })
    .patch('/patch', {
        schema: {
            description: "update barang",
            tags: ["barangs"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            body: barangSchema.select.omit({ createdAt: true }),
            response: {
                200: genericResponse(200),
                400: genericResponse(400),
                401: genericResponse(401),
                404: genericResponse(404)
            }
        },
        preHandler: authorizeUser
    }, async (req) => {
        const { id, name, code, status, condition, warranty, ruanganId, photo } = req.body

        const barang = await db
            .select()
            .from(barangs)
            .where(eq(barangs.id, id))

        if (barang.length == 0) {
            return {
                message: "Barang not found!",
                statusCode: 404
            }
        }

        await db.update(barangs)
            .set({
                name,
                code,
                status,
                condition,
                warranty,
                photo,
                ruanganId
            })

        return {
            message: "success",
            statusCode: 200
        }
    })
    .post("/", {
        schema: {
            description: "create a new barang",
            tags: ["barangs"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            body: barangSchema.select.omit({ createdAt: true, id: true }),
            response: {
                200: genericResponse(200),
                400: genericResponse(400),
                401: genericResponse(401)
            }
        },
        preHandler: authorizeUser
    }, async (req) => {
        const { name, code, status, condition, warranty, ruanganId, photo } = req.body;

        await db.insert(barangs).values({
            name,
            code,
            status,
            condition,
            warranty,
            ruanganId,
            photo
        }).execute();

        return {
            statusCode: 200,
            message: "Barang created successfully",
        };
    })
    .post("/upload", {
        schema: {
            description: "upload an image",
            tags: ["barangs"],
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
        let photoPath;

        for await (const part of parts) {
            if (part.type === 'file') {
                const uploadPath = path.join(import.meta.dirname, '../public/assets/barang/', part.filename);
                const writeStream = fs.createWriteStream(uploadPath);
                await part.file.pipe(writeStream);
                photoPath = uploadPath;
            }
        }

        if (!photoPath) {
            return {
                message: "No file uploaded",
                statusCode: 400
            }
        }

        return {
            statusCode: 200,
            message: "File uploaded successfully"
        };
    });
