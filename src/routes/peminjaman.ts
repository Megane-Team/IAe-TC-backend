import { genericResponse } from "@/constants.ts";
import { server } from "@/index.ts";
import { barangs } from "@/models/barangs.ts";
import { detailPeminjamans } from "@/models/detailPeminjamans.ts";
import { kendaraans } from "@/models/kendaraans.ts";
import { peminjamanCategory, peminjamans, peminjamanSchema} from "@/models/peminjamans.ts";
import { ruangans } from "@/models/ruangans.ts";
import { db } from "@/modules/database.ts";
import { getUser } from "@/utils/getUser.ts";
import { and, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";

export const prefix = "/peminjaman";
export const route = (instance: typeof server) => { instance
    .get("/:id", {
        schema: {
            description: "Get all peminjaman",
            tags: ["peminjaman"],
            params: z.object({
                id: z.string()
            }),
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: z.array(peminjamanSchema.select)
                })),
                401: genericResponse(401),
                404: genericResponse(404)
            }
        }
    }, async (req) => {
        const actor = await getUser(req.headers['authorization'], instance)

        if (!actor) {
            return {
                statusCode: 401,
                message: "Unauthorized"
            };
        }

        const { id } = req.params;
        const numId = parseInt(id);

        if (!numId) {
            const peminjaman = await db
                .select()
                .from(peminjamans)
                .where(eq(peminjamans.userId, actor.id))

            if (!peminjaman) {
                return {
                    statusCode: 404,
                    message: "Not found"
                };
            }

            return {
                statusCode: 200,
                message: "Success",
                data: peminjaman
            };
        } else {
            const peminjaman = await db
                .select()
                .from(peminjamans)
                .where(and(eq(peminjamans.userId, actor.id), eq(peminjamans.id, numId)))

            if (!peminjaman) {
                return {
                    statusCode: 404,
                    message: "Not found"
                };
            }

            return {
                statusCode: 200,
                message: "Success",
                data: peminjaman
            }
        }
    })
    .get("/draft", {
        schema: {
            description: "Get all draft peminjaman",
            tags: ["peminjaman"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: z.array(peminjamanSchema.select)
                })),
                401: genericResponse(401),
                404: genericResponse(404)
            }
        }
    }, async (req) => {
        const actor = await getUser(req.headers['authorization'], instance)

        if (!actor) {
            return {
                statusCode: 401,
                message: "Unauthorized"
            };
        }

        const detailPeminjaman = await db
            .select()
            .from(detailPeminjamans)
            .where(and(eq(detailPeminjamans.userId, actor.id), eq(detailPeminjamans.status, "draft")));

        const detailPeminjamanIds = detailPeminjaman.map(dp => dp.id);

        const peminjaman = await db
        .select()
        .from(peminjamans)
        .where(
            and(
                eq(peminjamans.userId, actor.id),
                or(
                    eq(peminjamans.category, peminjamanCategory.enumValues[0]),
                    eq(peminjamans.category, peminjamanCategory.enumValues[1])
                ),
                inArray(peminjamans.detailPeminjamanId, detailPeminjamanIds)
            )
        );

        if (!peminjaman) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        return {
            statusCode: 200,
            message: "Success",
            data: peminjaman
        };
    })
    .delete("/",{
        schema: {
            description: "Delete peminjaman",
            tags: ["peminjaman"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            body: z.object({
                id: z.number()
            }),
            response: {
                200: genericResponse(200),
                401: genericResponse(401),
                404: genericResponse(404)
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

        const { id } = req.body;

        const peminjaman = await db
            .delete(peminjamans)
            .where(and(eq(peminjamans.userId, actor.id), eq(peminjamans.id, id)))

        if (!peminjaman) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        return {
            statusCode: 200,
            message: "Success"
        };
    }) 
    .get('/ruangan/:id', {
        schema: {
            description: "Get peminjaman by ruangan id",
            tags: ["peminjaman"],
            params: z.object({
                id: z.string()
            }),
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: peminjamanSchema.select
                })),
                400: genericResponse(400),
                401: genericResponse(401),
                404: genericResponse(404)
            }
        }
    }, async (req) => {
        const actor = await getUser(req.headers['authorization'], instance)

        if (!actor) {
            return {
                statusCode: 401,
                message: "Unauthorized"
            };
        }

        const { id } = req.params;
        const numId = parseInt(id);

        if (!numId) {
            return {
                message: "Bad request",
                statusCode: 400
            }
        }

        const peminjaman = await db
            .select()
            .from(peminjamans)
            .where(eq(peminjamans.ruanganId, numId))

        if (peminjaman.length === 0) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        return {
            statusCode: 200,
            message: "Success",
            data: peminjaman[0]
        }
    })
    .get('/barang/:id', {
        schema: {
            description: "Get peminjaman by barang id",
            tags: ["peminjaman"],
            params: z.object({
                id: z.string()
            }),
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: peminjamanSchema.select
                })),
                400: genericResponse(400),
                401: genericResponse(401),
                404: genericResponse(404)
            }
        }
    }, async (req) => {
        const actor = await getUser(req.headers['authorization'], instance)

        if (!actor) {
            return {
                statusCode: 401,
                message: "Unauthorized"
            };
        }

        const { id } = req.params;
        const numId = parseInt(id);

        if (!numId) {
            return {
                message: "Bad request",
                statusCode: 400
            }
        }

        const peminjaman = await db
            .select()
            .from(peminjamans)
            .where(eq(peminjamans.barangId, numId))

        if (peminjaman.length === 0) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        return {
            statusCode: 200,
            message: "Success",
            data: peminjaman[0]
        }
    })
    .get('/kendaraan/:id', {
        schema: {
            description: "Get peminjamam by kendaraan id",
            tags: ["peminjaman"],
            params: z.object({
                id: z.string()
            }),
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: peminjamanSchema.select
                })),
                400: genericResponse(400),
                401: genericResponse(401),
                404: genericResponse(404)
            }
        }
    }, async (req) => {
        const actor = await getUser(req.headers['authorization'], instance)

        if (!actor) {
            return {
                statusCode: 401,
                message: "Unauthorized"
            };
        }

        const { id } = req.params;
        const numId = parseInt(id);

        if (!numId) {
            return {
                message: "Bad request",
                statusCode: 400
            }
        }

        const peminjaman = await db
            .select()
            .from(peminjamans)
            .where(eq(peminjamans.kendaraanId, numId))

        if (!peminjaman) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        return {
            statusCode: 200,
            message: "Success",
            data: peminjaman[0]
        }
    })
    .post('/', {
        schema: {
            description: 'Create a peminjaman',
            tags: ["peminjaman"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            body: peminjamanSchema.insert.omit({ id: true, createdAt: true, userId: true }),
            response: {
                200: genericResponse(200),
                400: genericResponse(400),
                401: genericResponse(401),
                429: genericResponse(429)
            }
        }
    }, async (req) => {
        const actor = await getUser(req.headers['authorization'], instance)

        if (!actor) {
            return {
                statusCode: 401,
                message: "Unauthorized"
            }
        }

        const { category, ruanganId, barangId, kendaraanId, detailPeminjamanId} = req.body
        
        const detailPeminjaman = await db
            .select()
            .from(detailPeminjamans)
            .where(and(eq(detailPeminjamans.userId, actor.id), eq(detailPeminjamans.id, detailPeminjamanId)))
        
        if (!detailPeminjaman) {
            return {
                statusCode: 400,
                message: "Bad request"
            }
        }
        
        if (['draft', 'pending'].includes(detailPeminjaman[0].status)) {
            let peminjaman;
            if (category === 'barang') {
                peminjaman = await db.select()
                    .from(peminjamans)
                    .where(and(eq(peminjamans.userId, actor.id), eq(peminjamans.detailPeminjamanId, detailPeminjaman[0].id), eq(peminjamans.barangId, barangId!)));
            } else if (category === 'kendaraan') {
                peminjaman = await db.select()
                    .from(peminjamans)
                    .where(and(eq(peminjamans.userId, actor.id), eq(peminjamans.detailPeminjamanId, detailPeminjaman[0].id), eq(peminjamans.kendaraanId, kendaraanId!)));
            } else if (category === 'ruangan') {
                peminjaman = await db.select()
                    .from(peminjamans)
                    .where(and(eq(peminjamans.userId, actor.id), eq(peminjamans.detailPeminjamanId, detailPeminjaman[0].id), eq(peminjamans.ruanganId, ruanganId!)));
            }
        
            if (peminjaman && peminjaman.length > 0) {
                return {
                    statusCode: 429,
                    message: 'duplicate request'
                };
            }
        }

        await db.insert(peminjamans).values({
            category,
            userId: actor.id,
            ruanganId,
            barangId,
            kendaraanId,
            detailPeminjamanId,
            createdAt: new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
        })

        return {
            statusCode: 200,
            message: "Success"
        }
    })
}
