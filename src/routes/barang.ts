import { genericResponse } from "@/constants.ts"
import { server } from "@/index.ts"
import { barangs, barangSchema } from "@/models/barangs.ts"
import { db } from "@/modules/database.ts"
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
    .put('/:id', {
        schema: {
            description: "update barang",
            tags: ["barangs"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            params: z.object({
                id: z.string()
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
        let photoPath: string = "";

        for await (const part of parts) {
            if (part.type === 'field') {
                fields[part.fieldname] = part.value;
            } else if (part.type === 'file' && part.fieldname === 'image') {
                const extension = path.extname(part.filename);
                const newFileName = `${fields.name}${extension}`;
                const uploadPath = path.join(import.meta.dirname, '../public/assets/barang/', newFileName);
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

        let warrantyDate;
        try {
            warrantyDate = new Date(String(fields.warranty)).toISOString();
        } catch (error) {
            return {
                message: "Invalid warranty date",
                statusCode: 400
            }
        }

        const { id } = req.params
        const numId = Number(id)

        const barang = await db
            .select()
            .from(barangs)
            .where(eq(barangs.id, numId))
            .execute();

        if (barang.length === 0) {
            return {
                message: "Barang not found",
                statusCode: 404
            }
        }

        await db.update(barangs)
            .set({
                name: String(fields.name),
                code: String(fields.code),
                condition: String(fields.condition),
                status: fields.status === 'true',
                warranty: warrantyDate,
                ruanganId: Number(fields.ruanganId),
                createdAt: new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })),
                photo: fields.name
            })
            .where(eq(barangs.id, Number(fields.id)))

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
                const uploadPath = path.join(import.meta.dirname, '../public/assets/barang/', newFileName);
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

        let warrantyDate;
        try {
            warrantyDate = new Date(String(fields.warranty)).toISOString();
        } catch (error) {
            return {
                message: "Invalid warranty date",
                statusCode: 400
            }
        }

        await db.insert(barangs).values({
            name: String(fields.name),
            code: String(fields.code),
            condition: String(fields.condition),
            status: fields.status === 'true',
            warranty: warrantyDate,
            ruanganId: Number(fields.ruanganId),
            createdAt: new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })),
            photo: fields.name
        })

        return {
            statusCode: 200,
            message: "Barang created successfully",
        };
    })
