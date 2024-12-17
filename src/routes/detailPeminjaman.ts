import { genericResponse } from "@/constants.ts"
import { server } from "@/index.ts"
import { barangs } from "@/models/barangs.ts"
import { detailPeminjamans, detailPeminjamanSchema } from "@/models/detailPeminjamans.ts"
import { kendaraans } from "@/models/kendaraans.ts"
import { logs } from "@/models/logs.ts"
import { peminjamans, peminjamanSchema } from "@/models/peminjamans.ts"
import { perangkats } from "@/models/perangkat.ts"
import { ruangans } from "@/models/ruangans.ts"
import { db } from "@/modules/database.ts"
import { getUser } from "@/utils/getUser.ts"
import { and, eq, or } from "drizzle-orm"
import { z } from "zod"

export const prefix = '/detailPeminjaman'
export const route = (instance: typeof server) => { instance
    .get("/", {
        schema: {
            description: "Get detail peminjaman",
            tags: ["detailPeminjaman"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: z.array(detailPeminjamanSchema.select)
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
            .where(and(
                or(
                    eq(detailPeminjamans.status, "approved"), 
                    eq(detailPeminjamans.status, "pending"), 
                    eq(detailPeminjamans.status, "rejected"), 
                    eq(detailPeminjamans.status, "returned"), 
                    eq(detailPeminjamans.status, "canceled")), 
                eq(detailPeminjamans.userId, actor.id)));

        if (!detailPeminjaman) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        return {
            statusCode: 200,
            message: "Success",
            data: detailPeminjaman
        };
    })
    .get("/:id", {
        schema: {
            description: "get DetailPeminjaman by Id",
            tags: ["detailPeminjaman"],
            params: z.object({
                id: z.string()
            }),
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: detailPeminjamanSchema.select
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
            return {
                statusCode: 400,
                message: "Bad request"
            };
        }

        const detailPeminjaman = await db
            .select()
            .from(detailPeminjamans)
            .where(eq(detailPeminjamans.id, numId))
            .execute();

        if (detailPeminjaman.length === 0) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        return {
            statusCode: 200,
            message: "Success",
            data: detailPeminjaman[0]
        };
    })
    .get("/:id/peminjaman", {
        schema: {
            description: "get peminjaman by detailPeminjaman Id",
            tags: ["detailPeminjaman"],
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
            return {
                statusCode: 400,
                message: "Bad request"
            };
        }

        const peminjaman = await db
            .select()
            .from(peminjamans)
            .where(eq(peminjamans.detailPeminjamanId, numId))
            .execute();

        if (peminjaman.length === 0) {
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
    .get("/checkItemsStatus", {
        schema: {
            description: "Check detailPeminjaman status",
            tags: ["detailPeminjaman"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200),
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
            .where(eq(detailPeminjamans.status, "approved"))
            .execute();

        if (detailPeminjaman.length === 0) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        // for every detailPeminjaman, check if the borrowedDate is passed

        for (const dp of detailPeminjaman) {
            if (dp.borrowedDate! < new Date()) {
                const peminjaman = await db
                    .select()
                    .from(peminjamans)
                    .where(eq(peminjamans.detailPeminjamanId, dp.id))
                    .execute();

                for (const p of peminjaman) {
                    if (p.category == "barang") {
                        await db.update(barangs)
                            .set({
                                status: true
                            })
                            .where(eq(barangs.id, p.barangId!))
                    }
                    if (p.category == "kendaraan") {
                        await db.update(kendaraans)
                            .set({
                                status: true
                            })
                            .where(eq(kendaraans.id, p.kendaraanId!))
                    }
                    if (p.category == "ruangan") {
                        await db.update(ruangans)
                            .set({
                                status: true
                            })
                            .where(eq(ruangans.id, p.ruanganId!))
                    }
                }
            }
        }

        return {
            statusCode: 200,
            message: "Success",
        };
    })
    .post('/pending', {
        schema: {
            description: "Create new detailPeminjaman(pending)",
            tags: ["detailPeminjaman"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            body: detailPeminjamanSchema.insert.omit({ id: true, createdAt: true, userId: true}).extend({
                borrowedDate: z.string().transform((str) => new Date(str)).optional(),
                estimatedTime: z.string().transform((str) => new Date(str)).optional(),
                returnDate: z.string().transform((str) => new Date(str)).optional()
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: detailPeminjamanSchema.select
                })),
                400: genericResponse(400),
                401: genericResponse(401),
            }
        }
    }, async (req) => {
        const actor = await getUser(req.headers['authorization'], instance)

        if (!actor) {
            return {
                message: "Unauthorized",
                statusCode: 401
            }
        }

        const { borrowedDate, estimatedTime, objective, destination, passenger, status }= req.body

        if (!borrowedDate) {
            return {
                message: "Bad request: borrowedDate is required",
                statusCode: 400
            }
        }

        await db.insert(detailPeminjamans).values({
            status,
            borrowedDate,
            estimatedTime,
            objective,
            destination,
            passenger,
            userId: actor.id,
            createdAt: new Date()
        })

        const dp = await db.select()
             .from(detailPeminjamans)
             .where(and(eq(detailPeminjamans.borrowedDate, borrowedDate), eq(detailPeminjamans.userId, actor.id)))

        await db.insert(logs).values({
            userId: actor.id,
            action: "Loan items",
            createdAt: new Date()
        }).execute();
             
        // TODO: send notification to admin
        
        return {
            statusCode: 200,
            message: "Success",
            data: dp[0]
        }
    })
    .post('/draft', {
        schema: {
            description: "Create new detailPeminjaman(draft)",
            tags: ["detailPeminjaman"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            body: detailPeminjamanSchema.insert.pick({ status: true }), 
            response: {
                200: genericResponse(200).merge(z.object({
                    data: detailPeminjamanSchema.select
                })),
                400: genericResponse(400),
                401: genericResponse(401),
            }
        }
    }, async (req) => {
        const actor = await getUser(req.headers['authorization'], instance)

        if (!actor) {
            return {
                message: "Unauthorized",
                statusCode: 401
            }
        }

        const { status }= req.body
        
        var dp = await db.select()
            .from(detailPeminjamans)
            .where(and(eq(detailPeminjamans.status, status), eq(detailPeminjamans.userId, actor.id)))

        if (dp.length === 0) {

            console.log('dp is null')
            await db.insert(detailPeminjamans).values({
                status,
                userId: actor.id,
                createdAt: new Date()
            })

            dp = await db.select()
                .from(detailPeminjamans)
                .where(and(eq(detailPeminjamans.status, status), eq(detailPeminjamans.userId, actor.id)))       
        }

        return {
            statusCode: 200,
            message: "Success",
            data: dp[0]
        }
    })
    .patch("/:id", {
        schema: {
            description: "Update detailPeminjaman",
            tags: ["detailPeminjaman"],
            params: z.object({
                id: z.string()
            }),
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            body: detailPeminjamanSchema.insert.omit({ id: true, createdAt: true, userId: true}).extend({
                borrowedDate: z.string().transform((str) => new Date(str)).optional(),
                estimatedTime: z.string().transform((str) => new Date(str)).optional(),
                returnDate: z.string().transform((str) => new Date(str)).optional()
            }),
            response: {
                200: genericResponse(200),
                400: genericResponse(400),
                401: genericResponse(401),
                404: genericResponse(404)
            }
        }
    }, async (req) => {
        const actor = await getUser(req.headers['authorization'], instance)

        if (!actor) {
            return {
                message: "Unauthorized",
                statusCode: 401
            }
        }

        const { id } = req.params
        const numId = parseInt(id)

        if (!numId) {
            return {
                message: "Bad request",
                statusCode: 400
            }
        }

        const { borrowedDate, estimatedTime, returnDate, objective, destination, passenger, status } = req.body

        const dp = await db.select()
            .from(detailPeminjamans)
            .where(and(eq(detailPeminjamans.id, numId), eq(detailPeminjamans.userId, actor.id)))

        if (dp.length === 0) {
            return {
                message: "Not found",
                statusCode: 404
            }
        }

        await db.update(detailPeminjamans)
            .set({
                borrowedDate,
                estimatedTime,
                returnDate,
                objective,
                destination,
                passenger,
                status
            })
            .where(eq(detailPeminjamans.id, numId))
            .execute()

        const peminjaman = await db.select()
            .from(peminjamans)
            .where(eq(peminjamans.detailPeminjamanId, numId))
            .execute()
            
        for (const p of peminjaman) {
            if (p.category == "barang") {
                await db.update(barangs)
                    .set({
                        status: true
                    })
                    .where(eq(barangs.id, p.barangId!))
            }
            if (p.category == "kendaraan") {
                await db.update(kendaraans)
                    .set({
                        status: true
                    })
                    .where(eq(kendaraans.id, p.kendaraanId!))
            }
            if (p.category == "ruangan") {
                await db.update(ruangans)
                    .set({
                        status: true
                    })
                    .where(eq(ruangans.id, p.ruanganId!))
            }
        }

        await db.insert(logs).values({
            userId: actor.id,
            action: "Loan items",
            createdAt: new Date()
        }).execute();

        // TODO: send notification to admin

        return {
            statusCode: 200,
            message: "Success",
        }
    })
    .patch("/:id/canceled", {
        schema: {
            description: "Update detailPeminjaman to canceled",
            tags: ["detailPeminjaman"],
            params: z.object({
                id: z.string()
            }),
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            body: detailPeminjamanSchema.insert.pick({ canceledReason: true }),
            response: {
                200: genericResponse(200),
                400: genericResponse(400),
                401: genericResponse(401),
                404: genericResponse(404)
            }
        }
    }, async (req) => {
        const actor = await getUser(req.headers['authorization'], instance)

        if (!actor) {
            return {
                message: "Unauthorized",
                statusCode: 401
            }
        }

        const { id } = req.params
        const numId = parseInt(id)

        if (!numId) {
            return {
                message: "Bad request",
                statusCode: 400
            }
        }

        const { canceledReason } = req.body

        const dp = await db.select()
            .from(detailPeminjamans)
            .where(and(eq(detailPeminjamans.id, numId), eq(detailPeminjamans.userId, actor.id)))

        if (dp.length === 0) {
            return {
                message: "Not found",
                statusCode: 404
            }
        }

        const peminjaman = await db.select()
            .from(peminjamans)
            .where(eq(peminjamans.detailPeminjamanId, numId))
            .execute()
            
        for (const p of peminjaman) {
            if (p.category == "barang") {
                await db.update(barangs)
                    .set({
                        status: false
                    })
                    .where(eq(barangs.id, p.barangId!))
            }
            if (p.category == "kendaraan") {
                await db.update(kendaraans)
                    .set({
                        status: false
                    })
                    .where(eq(kendaraans.id, p.kendaraanId!))
            }
            if (p.category == "ruangan") {
                await db.update(ruangans)
                    .set({
                        status: false
                    })
                    .where(eq(ruangans.id, p.ruanganId!))
            }
        }

        await db.insert(logs).values({
                    userId: actor.id,
                    action: "Canceled the loan",
                    createdAt: new Date()
                }).execute();

        await db.update(detailPeminjamans)
            .set({
                status: 'canceled',
                canceledReason
            })
            .where(eq(detailPeminjamans.id, numId))
            .execute()

        return {
            statusCode: 200,
            message: "Success",
        }
    })
    .patch('/returned', {
        schema: {
            description: 'update detailPeminjaman status to returned',
            tags: ["detailPeminjaman"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            body: detailPeminjamanSchema.insert.pick({ id: true }),
            response: {
                200: genericResponse(200),
                400: genericResponse(400),
                401: genericResponse(401),
                404: genericResponse(404)
            }
        }
    }, async (req) => {
        const actor = await getUser(req.headers['authorization'], instance)

        if (!actor) {
            return {
                message: "Unauthorized",
                statusCode: 401
            }
        }

        const { id } = req.body

        if (!id) {
            return {
                message: "Bad request",
                statusCode: 400
            }
        }

        await db.insert(logs).values({
            userId: actor.id,
            action: "Returned the loan",
            createdAt: new Date()
        }).execute();

        const dp = await db
            .select()
            .from(detailPeminjamans)
            .where(and(eq(detailPeminjamans.id, id), eq(detailPeminjamans.userId, actor.id)))

        if (!dp) {
            return {
                statusCode: 400,
                message: "bad request"
            }
        }

        const peminjaman = await db.select()
            .from(peminjamans)
            .where(eq(peminjamans.detailPeminjamanId, id))
            .execute()
            
        for (const p of peminjaman) {
            if (p.category == "barang") {
                await db.update(barangs)
                    .set({
                        status: false
                    })
                    .where(eq(barangs.id, p.barangId!))
            }
            if (p.category == "kendaraan") {
                await db.update(kendaraans)
                    .set({
                        status: false
                    })
                    .where(eq(kendaraans.id, p.kendaraanId!))
            }
            if (p.category == "ruangan") {
                await db.update(ruangans)
                    .set({
                        status: false
                    })
                    .where(eq(ruangans.id, p.ruanganId!))
            }
        }

        await db.update(detailPeminjamans)
            .set({
                status: 'returned',
            })
            .where(and(eq(detailPeminjamans.id, id), eq(detailPeminjamans.userId, actor.id)))
            .execute()

        return {
            statusCode: 200,
            message: 'Success'
        }
    })
    .patch('/approved', {
        schema: {
            description: 'update detailPeminjaman status to approved',
            tags: ["detailPeminjaman"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            body: detailPeminjamanSchema.insert.pick({ id: true }),
            response: {
                200: genericResponse(200),
                400: genericResponse(400),
                401: genericResponse(401),
                404: genericResponse(404)
            }
        }
    }, async (req) => {
        const actor = await getUser(req.headers['authorization'], instance)

        if (!actor) {
            return {
                message: "Unauthorized",
                statusCode: 401
            }
        }

        const { id } = req.body

        if (!id) {
            return {
                message: "Bad request",
                statusCode: 400
            }
        }

        const dp = await db
            .select()
            .from(detailPeminjamans)
            .where(and(eq(detailPeminjamans.id, id), eq(detailPeminjamans.userId, actor.id)))

        if (!dp) {
            return {
                statusCode: 400,
                message: "bad request"
            }
        }

        // TODO: send notification to user

        await db.insert(logs).values({
            userId: actor.id,
            action: "Accepted the loan request",
            createdAt: new Date()
        }).execute();

        await db.update(detailPeminjamans)
            .set({
                status: 'approved',
            })
            .where(and(eq(detailPeminjamans.id, id), eq(detailPeminjamans.userId, actor.id)))
            .execute()

        return {
            statusCode: 200,
            message: 'Success'
        }
    })
}
