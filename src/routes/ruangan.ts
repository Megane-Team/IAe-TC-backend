import { genericResponse } from "@/constants.ts";
import { server } from "@/index.ts";
import { barangs, barangSchema } from "@/models/barangs.ts";
import { ruangans, ruanganSchema } from "@/models/ruangans.ts";
import { db } from "@/modules/database.ts";
import { getUser } from "@/utils/getUser.ts";
import { eq } from "drizzle-orm";
import { z } from "zod";
import fs from 'fs';
import path from 'path';
import { authorizeUser } from "@/utils/preHandlers.ts";

export const prefix = '/ruangans';
export const route = (instance: typeof server) => { instance
    .get("/" , {
        schema: {
            description: "Get all ruangans",
            tags: ['Ruangan'],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: z.array(ruanganSchema.select.omit({ createdAt: true }))
                })),
                401: genericResponse(401),
            }
        },
        preHandler: authorizeUser
    }, async () => {
        const res = await db
            .select()
            .from(ruangans)
            .execute();

        return {
            statusCode: 200,
            message: "Success",
            data: res
        }
    })
    .get("/:id" , {
        schema: {
            description: "Get ruangans",
            tags: ['Ruangan'],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            params: z.object({
                id: z.string()
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: ruanganSchema.select.omit({ createdAt: true })
                })),
                401: genericResponse(401),
            }
        },
        preHandler: authorizeUser
    }, async (req) => {
        const { id } = req.params;
        const numberId = parseInt(id);

        const res = await db
                .select()
                .from(ruangans)
                .where(eq(ruangans.id, numberId))
                .execute();

        return {
            statusCode: 200,
            message: "Success",
            data: res[0]
        }
    })
    .get('/:id/barangs', {
        schema: {
            description: "Get all barangs by ruangan id",
            tags: ['Ruangan'],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            params: z.object({
                id: z.string()
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: z.array(barangSchema.select.omit({ createdAt: true }))
                })),
                401: genericResponse(401),
            }
        },
        preHandler: authorizeUser
    }, async (req) => {
        const { id } = req.params;
        const numberId = parseInt(id);

        if (!numberId) {
            return {
                message: "Not found",
                statusCode: 404
            }
        }

        const res = await db
            .select()
            .from(barangs)
            .where(eq(barangs.ruanganId, numberId))
            .execute();

        return {
            statusCode: 200,
            message: "Success",
            data: res
        }
    })
    .put("/:id", {
        schema: {
            description: "Update a ruangan",
            tags: ["Ruangan"],
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
                const newFileName = `${fields.code}${extension}`;
                const uploadPath = path.join(import.meta.dirname, '../public/assets/ruangan/', newFileName);
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

        const { id } = req.params;
        const numberId = parseInt(id);

        const ruangan = await db
            .select()
            .from(ruangans)
            .where(eq(ruangans.id, numberId))
            .execute();

        if (ruangan.length === 0) {
            return {
                message: "Ruangan not found",
                statusCode: 404
            }
        }

        await db.update(ruangans)
            .set({
                code: String(fields.code),
                status: fields.status === 'true',
                capacity: Number(fields.capacity),
                category: fields.category as "kelas" | "lab" | "gudang",
                photo: fields.name,
                tempatId: Number(fields.tempatId)
            })
            .where(eq(ruangans.id, numberId));

        return {
            message: "Success",
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
                const newFileName = `${fields.code}${extension}`;
                const uploadPath = path.join(import.meta.dirname, '../public/assets/ruangan/', newFileName);
                const writeStream = fs.createWriteStream(uploadPath);
                part.file.pipe(writeStream);
                photoPath = uploadPath;
            }
        }

        if (!fields.code || !photoPath) {
            return {
            message: "Name or file not provided",
            statusCode: 400
            }
        }

        await db.insert(ruangans).values({
            code: String(fields.code),
            status: fields.status === 'true',
            capacity: Number(fields.capacity),
            category: fields.category as "kelas" || "lab" || "gudang",
            photo: String(fields.code),
            createdAt: new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })),
            tempatId: Number(fields.tempatId)
        })

        return {
            statusCode: 200,
            message: "Barang created successfully",
        };
    })
}
