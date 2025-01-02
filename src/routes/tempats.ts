import { genericResponse } from "@/constants.ts";
import { server } from "@/index.ts";
import { kendaraans, kendaraanSchema } from "@/models/kendaraans.ts";
import { ruangans, ruanganSchema } from "@/models/ruangans.ts";
import { tempats, tempatSchema } from "@/models/tempat.ts";
import { db } from "@/modules/database.ts";
import { getUser } from "@/utils/getUser.ts";
import { eq } from "drizzle-orm";
import { z } from "zod";
import fs from 'fs';
import path from 'path';
import { authorizeUser } from "@/utils/preHandlers.ts";

export const prefix = "/tempats";
export const route = (instance: typeof server) => { instance
    .get("/", {
        schema: {
            description: "get all tempat",
            tags: ["tempats"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: z.array(tempatSchema.select.omit({ createdAt: true }))
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
        const res = await db
            .select()
            .from(tempats)
            .execute();

        return {
            statusCode: 200,
            message: "Success",
            data: res
        }
    })
    .get("/:id", {
        schema: {
            description: "get tempat by id",
            tags: ["tempats"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            params: z.object({
                id: z.string()
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: tempatSchema.select.omit({ createdAt: true })
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

        const { id } = req.params;
        const numberId = parseInt(id);

        const res = await db
                .select()
                .from(tempats)
                .where(eq(tempats.id, numberId))
                .execute();

        return {
            statusCode: 200,
            message: "Success",
            data: res[0]
        }
    })
    .get('/:id/ruangans', {
        schema: {
            description: "get all the ruangan data by tempat id",
            tags: ["tempats"],
            params: z.object({
                id: z.string()
            }),
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: z.array(ruanganSchema.select.omit({ createdAt: true}))
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

        const { id } = req.params
        const numberId = Number(id);

        const res = await db
        .select()
        .from(ruangans)
        .where(eq(ruangans.tempatId, numberId))

        return {
            statusCode: 200,
            message: 'Success',
            data: res
        }

    })
    .get("/:id/kendaraans", {
        schema: {
            description: "get all the kendaraan data",
            tags: ["tempats"],
            params: z.object({
                id: z.string()
            }),
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: z.array(kendaraanSchema.select.omit({ createdAt: true }))
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

        const { id } = req.params
        const numberId = Number(id);

        const res = await db
            .select()
            .from(kendaraans)
            .where(eq(kendaraans.tempatId, numberId))
            .execute();

        return {
            statusCode: 200,
            message: "Success",
            data: res
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
                const uploadPath = path.join(import.meta.dirname, '../public/assets/tempat/', newFileName);
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

        await db.insert(tempats).values({
            name: String(fields.name),
            category: fields.category as "gedung" || "parkiran",
            photo: photoPath,
            createdAt: new Date()
        })

        return {
            statusCode: 200,
            message: "Barang created successfully",
        };
    })
}
