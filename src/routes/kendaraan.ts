import { genericResponse } from "@/constants.ts";
import { server } from "@/index.ts";
import { kendaraans, kendaraanSchema } from "@/models/kendaraans.ts";
import { db } from "@/modules/database.ts";
import { getUser } from "@/utils/getUser.ts";
import { authorizeUser } from "@/utils/preHandlers.ts";
import { eq } from "drizzle-orm";
import path from "path";
import { z } from "zod";
import fs from 'fs';

export const prefix = "/kendaraans";
export const route = (instance: typeof server) => { instance
    .get("/", {
        schema: {
            description: "get all kendaraan",
            tags: ["kendaraans"],
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

        const res = await db
                .select()
                .from(kendaraans)
                .execute();

        return {
            statusCode: 200,
            message: "Success",
            data: res
        } 
    })
    .get("/:id", {
        schema: {
            description: "get kendaraan by id",
            tags: ["kendaraans"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            params: z.object({
                id: z.string()
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: kendaraanSchema.select.omit({ createdAt: true })
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
                .from(kendaraans)
                .where(eq(kendaraans.id, numberId))
                .execute();

        return {
            statusCode: 200,
            message: "Success",
            data: res[0]
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

        await db.insert(kendaraans).values({
            name: String(fields.name),
            plat: String(fields.plat),
            condition: String(fields.condition),
            status: fields.status === 'true',
            warranty: warrantyDate,
            capacity: Number(fields.capacity),
            category: fields.category as "mobil" | "motor" | "truk",
            color: String(fields.color),
            tax: new Date(String(fields.tax)).toISOString(),
            createdAt: new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })),
            photo: fields.name,
            tempatId: Number(fields.tempatId)
        })

        return {
            statusCode: 200,
            message: "Barang created successfully",
        }
    });
}
