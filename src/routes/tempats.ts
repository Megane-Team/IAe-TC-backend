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
        },
        preHandler: authorizeUser
    }, async () => {
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
        },
        preHandler: authorizeUser
    }, async (req) => {
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
        },
        preHandler: authorizeUser
    }, async (req) => {
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
        },
        preHandler: authorizeUser
    }, async (req) => {
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
    .put("/:name", {
        schema: {
            description: "Update a tempat",
            tags: ["tempats"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            params: z.object({
                name: z.string()
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
        const { name } = req.params;

        for await (const part of parts) {
            if (part.type === 'field') {
                fields[part.fieldname] = part.value;
            } else if (part.type === 'file' && part.fieldname === 'photo') {
                const extension = path.extname(part.filename);
                const newFileName = `${fields.name}${extension}`;
                const uploadPath = path.join(import.meta.dirname, '../public/assets/tempat/', newFileName);
                const writeStream = fs.createWriteStream(uploadPath);
                part.file.pipe(writeStream);
                photoPath = uploadPath;
            }
        }

        const tempat = await db
            .select()
            .from(tempats)
            .where(eq(tempats.name, name))
            .execute();

        if (tempat.length === 0) {
            return {
            message: "Tempat not found",
            statusCode: 404
            }
        }

        if (typeof fields.name === 'string' && fields.name !== tempat[0].name) {
            const oldPhotoPath = path.join(import.meta.dirname, '../public/assets/tempat/', `${tempat[0].photo}.png`);
            const newPhotoPath = path.join(import.meta.dirname, '../public/assets/tempat/', `${fields.name}.png`);
            if (fs.existsSync(oldPhotoPath)) {
                await fs.promises.rename(oldPhotoPath, newPhotoPath);
            }
        }

        await db.update(tempats)
            .set({
            name: fields.name || tempat[0].name,
            category: fields.category as "gedung" | "parkiran" || tempat[0].category,
            photo: fields.name || tempat[0].name,
            })
            .where(eq(tempats.name, name));

        return {
            message: "Success",
            statusCode: 200
        }
    })
    .post("/", {
        schema: {
            description: "create a new Tempat",
            tags: ["tempats"],
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
            photo: fields.name,
            createdAt: new Date()
        })

        return {
            statusCode: 200,
            message: "Tempat created successfully",
        };
    })
    .delete("/:name", {
        schema: {
            description: "Delete a tempat by id",
            tags: ["tempats"],
            params: z.object({
                name: z.string()
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
        const { name } = req.params;

        if (!name) {
            return {
                statusCode: 400,
                message: "Bad request"
            };
        }

        const tempat = await db.select().from(tempats).where(eq(tempats.name, name)).execute();

        if (tempat.length === 0) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        const photoPath = path.join(import.meta.dirname, '../public/assets/tempat/', `${tempat[0].photo}.png`);
        if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
        }

        await db.delete(tempats).where(eq(tempats.name, name)).execute();

        return {
            statusCode: 200,
            message: "Tempat deleted successfully"
        };
    })
    .delete("/bulk", {
        schema: {
            description: "Delete multiple tempat by name",
            tags: ["tempats"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            body: z.object({
                names: z.array(z.string())
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
        const { names } = req.body;

        if (!names || names.length === 0) {
            return {
                statusCode: 400,
                message: "Bad request"
            };
        }

        for (const name of names) {
            if (!name) {
                return {
                    statusCode: 400,
                    message: "Bad request"
                };
            }

            const tempatToDelete = await db
                .select()
                .from(tempats)
                .where(eq(tempats.name, name)).execute().then((res) => res[0]);

            if (!tempatToDelete) {
                return {
                    statusCode: 404,
                    message: "Not found"
                };
            }

            const photoPath = path.join(import.meta.dirname, '../public/assets/tempat/', `${tempatToDelete.photo}.png`);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }
        
            await db.delete(tempats).where(eq(tempats.name, name)).execute();
        }

        return {
            statusCode: 200,
            message: "Tempats deleted successfully"
        };

    })
}
