import { genericResponse } from "@/constants.ts"
import { server } from "@/index.ts"
import { barangs, barangSchema } from "@/models/barangs.ts"
import { db } from "@/modules/database.ts"
import { eq } from "drizzle-orm"
import path from "path"
import { z } from "zod"
import fs from 'fs';
import { authorizeUser } from "@/utils/preHandlers.ts"
import { ruangans } from "@/models/ruangans.ts"
import ExcelJS from 'exceljs';

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
    .put('/:code', {
        schema: {
            description: "Update a barang",
            tags: ["barangs"],
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
        let photoPath: string = "";

        for await (const part of parts) {
            if (part.type === 'field') {
                fields[part.fieldname] = part.value;
            } else if (part.type === 'file' && part.fieldname === 'photo') {
                const extension = path.extname(part.filename);
                const newFileName = `${fields.name}${extension}`;
                const uploadPath = path.join(import.meta.dirname, '../public/assets/barang/', newFileName);
                const writeStream = fs.createWriteStream(uploadPath);
                part.file.pipe(writeStream);
                photoPath = uploadPath;
            }
        }

        const barang = await db
            .select()
            .from(barangs)
            .where(eq(barangs.code, code))
            .execute();

        if (barang.length === 0) {
            return {
                message: "Barang not found",
                statusCode: 404
            }
        }

        if (typeof fields.name === 'string' && fields.name !== barang[0].name) {
            const oldPhotoPath = path.join(import.meta.dirname, '../public/assets/barang/', `${barang[0].photo}.png`);
            const newPhotoPath = path.join(import.meta.dirname, '../public/assets/barang/', `${fields.name}.png`);
            if (fs.existsSync(oldPhotoPath)) {
                await fs.promises.rename(oldPhotoPath, newPhotoPath);
            }
        }

        let warrantyDate;
        try {
            const [day, month, year] = fields.warranty.split('-');
            warrantyDate = new Date(`${year}-${month}-${day}`).toISOString();
        } catch (error) {
            return {
            message: "Invalid warranty date",
            statusCode: 400
            }
        }

        const ruangan = await db
            .select()
            .from(ruangans)
            .where(eq(ruangans.code, fields.ruangan_code))
            .execute()
            .then((res) => res[0]);

        const realRuangan = await db
            .select()
            .from(ruangans)
            .where(eq(ruangans.code, fields.ruangan_code || ruangan.code))
            .execute()
            .then((res) => res[0]);

        await db.update(barangs)
            .set({
                name: fields.name || barang[0].name,
                code: fields.code || barang[0].code,
                condition: fields.condition || barang[0].condition,
                status: fields.status === 'true' || barang[0].status,
                warranty: warrantyDate || barang[0].warranty,
                ruanganId: realRuangan.id || barang[0].ruanganId,
                photo: fields.name || barang[0].photo
            })
            .where(eq(barangs.code, code));

        return {
            message: "Success",
            statusCode: 200
        }
    })
    .post("/", {
        schema: {
            description: "Create a new barang",
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
            } else if (part.type === 'file' && part.fieldname === 'photo') {
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

        console.log(fields);

        let warrantyDate;
        try {
            const [day, month, year] = fields.warranty.split('-');
            warrantyDate = new Date(`${year}-${month}-${day}`).toISOString();
        } catch (error) {
            return {
            message: "Invalid warranty date",
            statusCode: 400
            }
        }

        const ruangan = await db
            .select()
            .from(ruangans)
            .where(eq(ruangans.code, fields.ruangan_code))
            .execute()
            .then((res) => res[0]);

        await db.insert(barangs).values({
            name: fields.name,
            code: fields.code,
            status: fields.status === 'true',
            condition: fields.condition,
            warranty: warrantyDate,
            ruanganId: ruangan.id,
            createdAt: new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })),
            photo: fields.name
        })

        return {
            statusCode: 200,
            message: "Barang created successfully",
        };
    })
    .delete("/:code", {
        schema: {
            description: "Delete a barang by code",
            tags: ["barangs"],
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

        const barang = await db.select().from(barangs).where(eq(barangs.code, code)).execute();

        if (barang.length === 0) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        const photoPath = path.join(import.meta.dirname, '../public/assets/barang/', `${barang[0].photo}.png`);
        if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
        }

        await db.delete(barangs).where(eq(barangs.code, code)).execute();

        return {
            statusCode: 200,
            message: "Barang deleted successfully"
        };
    })
    .delete("/bulk", {
        schema: {
            description: "Delete multiple barangs by code",
            tags: ["barangs"],
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

            const barangToDelete = await db
                .select()
                .from(barangs)
                .where(eq(barangs.code, code)).execute().then((res) => res[0]);

            if (!barangToDelete) {
                return {
                    statusCode: 404,
                    message: "Not found"
                };
            }

            const photoPath = path.join(import.meta.dirname, '../public/assets/barang/', `${barangToDelete.photo}.png`);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }

            await db.delete(barangs).where(eq(barangs.code, code)).execute();
        }

        return {
            statusCode: 200,
            message: "Barangs deleted successfully"
        };
    })
    .post("/import", {
        schema: {
            description: "Import barangs from an xlsx file",
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
        let filePath: string = "";

        for await (const part of parts) {
            if (part.type === 'file' && part.fieldname === 'file') {
                const uploadPath = path.join(import.meta.dirname, '../uploads/', part.filename);
                const writeStream = fs.createWriteStream(uploadPath);
                part.file.pipe(writeStream);
                await new Promise((resolve, reject) => {
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                });
                filePath = uploadPath;
            }
        }

        if (!filePath) {
            return {
                statusCode: 400,
                message: "File not provided"
            };
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);

        worksheet?.getImages().forEach((image, index) => {
            const media = workbook.model.media?.find((media: any) => media.index === image.imageId);
            if (!media) {
            throw new Error(`Media with imageId ${image.imageId} not found`);
            }
            const imageBuffer = media.buffer;
            const imageName = `image${index + 1}.png`;
            const imagePath = path.join(import.meta.dirname, '../public/assets/barang/', imageName);

            fs.writeFileSync(imagePath, new Uint8Array(imageBuffer)); // Save the image to the file system
        });

        worksheet?.eachRow(async (row, rowNumber) => {
            if (rowNumber > 1) {
                const values = row.values as any[];
                const [name, code, condition, status, warranty, ruangan_code] = values.slice(1, 7);

                if (name && code && condition && status && warranty && ruangan_code) {
                    const newPhotoName = `${name}.png`;
                    const photoPath = path.join(import.meta.dirname, '../public/assets/barang/', newPhotoName);
                    
                    const ruangan = await db
                        .select()
                        .from(ruangans)
                        .where(eq(ruangans.code, ruangan_code))
                        .execute()
                        .then((res) => res[0]);

                    await db.insert(barangs).values({
                        name: name,
                        code: code,
                        condition: condition,
                        status: status === 'Digunakan',
                        warranty: warranty,
                        ruanganId: ruangan.id,
                        createdAt: new Date(),
                        photo: name
                    }).execute();

                    const imageName = `image${rowNumber - 1}.png`;
                                        
                    fs.renameSync(path.join(import.meta.dirname, '../public/assets/barang/', imageName), photoPath);
                }
            }
        });

        fs.unlinkSync(filePath);

        return {
            statusCode: 200,
            message: "Barangs imported successfully"
        };
    })
