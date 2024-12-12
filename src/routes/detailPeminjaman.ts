import { genericResponse } from "@/constants.ts"
import { server } from "@/index.ts"
import { detailPeminjamans, detailPeminjamanSchema } from "@/models/detailPeminjamans.ts"
import { peminjamans, peminjamanSchema } from "@/models/peminjamans.ts"
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

        if (!dp) {
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
    .patch('/:id/returned', {
        schema: {
            description: 'update detailPeminjaman status to returned',
            params: z.object({
                id: z.string()
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

        const dp = await db
            .select()
            .from(detailPeminjamans)
            .where(and(eq(detailPeminjamans.id, numId), eq(detailPeminjamans.userId, actor.id)))

        if (!dp) {
            return {
                statusCode: 400,
                message: "bad request"
            }
        }

        await db.update(detailPeminjamans)
            .set({
                status: 'returned',
            })
            .where(and(eq(detailPeminjamans.id, numId), eq(detailPeminjamans.userId, actor.id)))
            .execute()

        return {
            statusCode: 200,
            message: 'Success'
        }
    })
}
