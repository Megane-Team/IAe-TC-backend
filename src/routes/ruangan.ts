import { genericResponse } from "@/constants.ts";
import { server } from "@/index.ts";
import { barangs, barangSchema } from "@/models/barangs.ts";
import { ruangans, ruanganSchema } from "@/models/ruangans.ts";
import { db } from "@/modules/database.ts";
import { eq } from "drizzle-orm";
import { z } from "zod";
import fs from 'fs';
import path from 'path';
import { authorizeUser } from "@/utils/preHandlers.ts";
import { tempats } from "@/models/tempat.ts";

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
    .put("/:code", {
        schema: {
            description: "Update a ruangan",
            tags: ["Ruangan"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            params: z.object({
                code: z.string()
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
        const { code } = req.params;

        for await (const part of parts) {
            if (part.type === 'field') {
                fields[part.fieldname] = part.value;
            } else if (part.type === 'file' && part.fieldname === 'photo') {
                const extension = path.extname(part.filename);
                const newFileName = `${fields.code}${extension}`;
                const uploadPath = path.join(import.meta.dirname, '../public/assets/ruangan/', newFileName);
                const writeStream = fs.createWriteStream(uploadPath);
                part.file.pipe(writeStream);
            }
        }

        const ruangan = await db
            .select()
            .from(ruangans)
            .where(eq(ruangans.code, code))
            .execute();

        if (ruangan.length === 0) {
            return {
                message: "Ruangan not found",
                statusCode: 404
            }
        }

        if (typeof fields.code === 'string' && fields.code !== ruangan[0].code) {
            const oldPhotoPath = path.join(import.meta.dirname, '../public/assets/tempat/', `${ruangan[0].photo}.png`);
            const newPhotoPath = path.join(import.meta.dirname, '../public/assets/tempat/', `${fields.name}.png`);
            if (fs.existsSync(oldPhotoPath)) {
                await fs.promises.rename(oldPhotoPath, newPhotoPath);
            }
        }

        const tempat = await db
            .select()
            .from(tempats)
            .where(eq(tempats.id, ruangan[0].tempatId))
            .execute()
            .then((res) => res[0]);

        const realTempat = await db
            .select()
            .from(tempats)
            .where(eq(tempats.name, fields.tempat_name || tempat.name))
            .execute()
            .then((res) => res[0]);
            
        await db.update(ruangans)
            .set({
                code: fields.code || ruangan[0].code, 
                status: fields.status === 'true' || ruangan[0].status,
                capacity: Number(fields.capacity) || ruangan[0].capacity,
                category: fields.category as "kelas" | "lab" | "gudang" || ruangan[0].category,
                photo: fields.code || ruangan[0].photo,
                tempatId: realTempat.id || ruangan[0].tempatId
            })
            .where(eq(ruangans.code, code));

        return {
            message: "Success",
            statusCode: 200
        }
    })
    .post("/", {
        schema: {
            description: "create a new ruangan",
            tags: ["Ruangan"],
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

        const tempat = await db
            .select()
            .from(tempats)
            .where(eq(tempats.name, fields.tempat_name))
            .execute()
            .then((res) => res[0]);

        await db.insert(ruangans).values({
            code: String(fields.code),
            status: fields.status === 'true',
            capacity: Number(fields.capacity),
            category: fields.category as "kelas" || "lab" || "gudang",
            photo: String(fields.code),
            createdAt: new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })),
            tempatId: tempat.id
        })

        return {
            statusCode: 200,
            message: "Ruangan created successfully",
        };
    })
    .delete("/:code", {
        schema: {
            description: "Delete a ruangan by code",
            tags: ["Ruangan"],
            params: z.object({
                code: z.string()
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
        const { code } = req.params;

        if (!code) {
            return {
                statusCode: 400,
                message: "Bad request"
            };
        }

        const ruangan = await db.select().from(ruangans).where(eq(ruangans.code, code)).execute();

        if (ruangan.length === 0) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        const photoPath = path.join(import.meta.dirname, '../public/assets/ruangan/', `${ruangan[0].photo}.png`);
        if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
        }

        await db.delete(ruangans).where(eq(ruangans.code, code)).execute();

        return {
            statusCode: 200,
            message: "Ruangan deleted successfully"
        };
    })
    .delete("/bulk", {
        schema: {
            description: "Delete multiple ruangans by code",
            tags: ["Ruangan"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            body: z.object({
                codes: z.array(z.string())
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
        const { codes } = req.body;

        if (!codes || codes.length === 0) {
            return {
                statusCode: 400,
                message: "Bad request"
            };
        }

        for (const code of codes) {
            if (!code) {
                return {
                    statusCode: 400,
                    message: "Bad request"
                };
            }

            const ruanganToDelete = await db
                .select()
                .from(ruangans)
                .where(eq(ruangans.code, code)).execute().then((res) => res[0]);

            if (!ruanganToDelete) {
                return {
                    statusCode: 404,
                    message: "Not found"
                };
            }

            const photoPath = path.join(import.meta.dirname, '../public/assets/ruangan/', `${ruanganToDelete.photo}.png`);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }

            await db.delete(ruangans).where(eq(ruangans.code, code)).execute();
        }

        return {
            statusCode: 200,
            message: "Ruangans deleted successfully"
        };
    })
}
