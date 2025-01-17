import { genericResponse } from "@/constants.ts";
import { server } from "@/index.ts";
import { kendaraans, kendaraanSchema } from "@/models/kendaraans.ts";
import { db } from "@/modules/database.ts";
import { authorizeUser } from "@/utils/preHandlers.ts";
import { eq } from "drizzle-orm";
import path from "path";
import { z } from "zod";
import fs from 'fs';
import { tempats } from "@/models/tempat.ts";
import ExcelJS from 'exceljs';

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
        },
        preHandler: authorizeUser
    }, async () => {
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
        },
        preHandler: authorizeUser
    }, async (req) => {
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
            description: "create a new kendaraan",
            tags: ["kendaraans"],
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
                const uploadPath = path.join(import.meta.dirname, '../public/assets/kendaraan/', newFileName);
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
            const [wDay, wMonth, wYear] = fields.warranty.split('-');
            warrantyDate = new Date(`${wYear}-${wMonth}-${wDay}`).toISOString();
        } catch (error) {
            return {
            message: "Invalid warranty date",
            statusCode: 400
            }
        }

        let taxDate;
        try {
            const [tDay, tMonth, tYear] = fields.tax.split('-');
            taxDate = new Date(`${tYear}-${tMonth}-${tDay}`).toISOString();
        } catch (error) {
            return {
            message: "Invalid tax date",
            statusCode: 400
            }
        }

        const tempat = await db
            .select()
            .from(tempats)
            .where(eq(tempats.name, fields.tempat_name))
            .execute()
            .then((res) => res[0]);

        await db.insert(kendaraans).values({
            name: fields.name,
            plat: fields.plat,
            condition: fields.condition,
            status: fields.status === 'true',
            warranty: warrantyDate,
            capacity: Number(fields.capacity),
            category: fields.category as "mobil" | "motor" | "truk",
            color: fields.color,
            tax: taxDate,
            createdAt: new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })),
            photo: fields.name,
            tempatId: tempat.id
        })

        return {
            statusCode: 200,
            message: "Kendaraan created successfully",
        }
    })
    .put('/:plat', {
        schema: {
            description: "Update a kendaraan",
            tags: ["kendaraans"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            params: z.object({
                plat: z.string()
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
        const { plat } = req.params;

        for await (const part of parts) {
            if (part.type === 'field') {
                fields[part.fieldname] = part.value;
            } else if (part.type === 'file' && part.fieldname === 'image') {
                const extension = path.extname(part.filename);
                const newFileName = `${fields.plat}${extension}`;
                const uploadPath = path.join(import.meta.dirname, '../public/assets/kendaraan/', newFileName);
                const writeStream = fs.createWriteStream(uploadPath);
                part.file.pipe(writeStream);
            }
        }

        const kendaraan = await db
            .select()
            .from(kendaraans)
            .where(eq(kendaraans.plat, plat))
            .execute();

        if (kendaraan.length === 0) {
            return {
                message: "Kendaraan not found",
                statusCode: 404
            }
        }

        if (typeof fields.plat === 'string' && fields.play !== kendaraan[0].plat) {
            const oldPhotoPath = path.join(import.meta.dirname, '../public/assets/kendaraan/', `${kendaraan[0].photo}.png`);
            const newPhotoPath = path.join(import.meta.dirname, '../public/assets/kendaraan/', `${fields.plat}.png`);
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

        let taxDate;
        try {
            const [day, month, year] = fields.tax.split('-');
            taxDate = new Date(`${year}-${month}-${day}`).toISOString();
        } catch (error) {
            return {
                message: "Invalid tax date",
                statusCode: 400
            }
        }

        const tempat = await db
            .select()
            .from(tempats)
            .where(eq(tempats.name, fields.tempat_name))
            .execute()
            .then((res) => res[0]);

        await db.update(kendaraans)
            .set({
                name: fields.name || kendaraan[0].name,
                plat: fields.plat || kendaraan[0].plat,
                condition: fields.condition || kendaraan[0].condition,
                status: fields.status === 'true' || kendaraan[0].status,
                warranty: warrantyDate || kendaraan[0].warranty,
                capacity: Number(fields.capacity) || kendaraan[0].capacity,
                category: fields.category as "mobil" | "motor" | "truk" || kendaraan[0].category,
                color: fields.color || kendaraan[0].color,
                tax: taxDate || kendaraan[0].tax,
                tempatId: tempat.id || kendaraan[0].tempatId,
                photo: fields.name || kendaraan[0].photo
            })
            .where(eq(kendaraans.plat, plat));

        return {
            message: "Success",
            statusCode: 200
        }
    })
    .delete("/:plat", {
        schema: {
            description: "Delete a kendaraan by plat",
            tags: ["kendaraans"],
            params: z.object({
                plat: z.string()
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
        const { plat } = req.params;

        if (!plat) {
            return {
                statusCode: 400,
                message: "Bad request"
            };
        }

        const kendaraan = await db.select().from(kendaraans).where(eq(kendaraans.plat, plat)).execute();

        if (kendaraan.length === 0) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }
        
        await db.delete(kendaraans).where(eq(kendaraans.plat, plat)).execute();

        const photoPath = path.join(import.meta.dirname, '../public/assets/kendaraan/', `${kendaraan[0].photo}.png`);
        if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
        }

        return {
            statusCode: 200,
            message: "Kendaraan deleted successfully"
        };
    })
    .delete("/bulk", {
        schema: {
            description: "Delete multiple kendaraans by plat",
            tags: ["kendaraans"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            body: z.object({
                plats: z.array(z.string())
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
        const { plats } = req.body;

        if (!plats || plats.length === 0) {
            return {
                statusCode: 400,
                message: "Bad request"
            };
        }

        for (const plat of plats) {
            if (!plat) {
                return {
                    statusCode: 400,
                    message: "Bad request"
                };
            }

            const kendaraanToDelete = await db
                .select()
                .from(kendaraans)
                .where(eq(kendaraans.plat, plat)).execute().then((res) => res[0]);

            if (!kendaraanToDelete) {
                return {
                    statusCode: 404,
                    message: "Not found"
                };
            }
            
            await db.delete(kendaraans).where(eq(kendaraans.plat, plat)).execute();

            const photoPath = path.join(import.meta.dirname, '../public/assets/kendaraan/', `${kendaraanToDelete.photo}.png`);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }
        }

        return {
            statusCode: 200,
            message: "Kendaraans deleted successfully"
        };
    })
    .post("/import", {
        schema: {
            description: "Import kendaraans from an xlsx file",
            tags: ["kendaraans"],
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

        worksheet?.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
                const values = row.values as any[];
                const [name] = values.slice(1, 2);

                if (name !== 'nama_kendaraan') {
                    throw new Error('Invalid file format');
                }
            }
        });

        worksheet?.getImages().forEach((image) => {
            const rowNumber = image.range.tl.nativeRow + 1; // Get the row number of the image
            const media = workbook.model.media?.find((media: any) => media.index === image.imageId);
            if (!media) {
            throw new Error(`Media with imageId ${image.imageId} not found`);
            }
            const imageBuffer = media.buffer;
            const imageName = `image${rowNumber}.png`;
            const imagePath = path.join(import.meta.dirname, '../public/assets/kendaraan/', imageName);

            fs.writeFileSync(imagePath, new Uint8Array(imageBuffer)); // Save the image to the file system
        });

        worksheet?.eachRow(async (row, rowNumber) => {
            if (rowNumber > 1) {
                const values = row.values as any[];
                const [name, plat, status, condition, warranty, capacity, category, color, tax, tempat_name] = values.slice(1, 11);

                if (name && plat && condition && status && warranty && capacity && category && color && tax && tempat_name) {
                    console.log({ name, plat, status, condition, warranty, capacity, category, color, tax, tempat_name });

                    const newPhotoName = `${plat}.png`;
                    const photoPath = path.join(import.meta.dirname, '../public/assets/kendaraan/', newPhotoName);

                    const tempat = await db
                        .select()
                        .from(tempats)
                        .where(eq(tempats.name, tempat_name))
                        .execute()
                        .then((res) => res[0]);

                    await db.insert(kendaraans).values({
                        name,
                        plat,
                        condition,
                        status: status === 'Digunakan',
                        warranty,
                        capacity: Number(capacity),
                        category: category as "mobil" | "motor" | "truk",
                        color,
                        tax: new Date(tax).toISOString(),
                        createdAt: new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })),
                        photo: plat,
                        tempatId: tempat.id
                    });

                    const imageName = `image${rowNumber}.png`;

                    fs.renameSync(path.join(import.meta.dirname, '../public/assets/kendaraan/', imageName), photoPath);
                }
            }
        });

        fs.unlinkSync(filePath);

        return {
            statusCode: 200,
            message: "Kendaraans imported successfully"
        };
    })
}
