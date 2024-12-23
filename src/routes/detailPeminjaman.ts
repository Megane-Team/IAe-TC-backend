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
import { and, eq, inArray, lt, or } from "drizzle-orm"
import { z } from "zod"
import { getNotificationMessage, getNotificationTitleMessage } from "./notifikasi.ts"
import { notifikasis } from "@/models/notifikasis.ts"
import { users } from "@/models/users.ts"
import { getMessaging } from "firebase-admin/messaging"
import { checkItemsStatus } from "@/utils/checkStatus.ts"

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
    .get('/all/barang/:id', {
        schema: {
            description: "Get all detailPeminjaman by barang id",
            tags: ["detailPeminjaman"],
            params: z.object({
                id: z.string()
            }),
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

        const { id } = req.params
        const numId = parseInt(id)

        if (!numId) {
            return {
                statusCode: 400,
                message: "Bad request"
            };
        }

        const peminjaman = await db
            .select()
            .from(peminjamans)
            .where(and(eq(peminjamans.barangId, numId), eq(peminjamans.category, "barang")))
            .execute()

        if (peminjaman.length === 0) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        const detailPeminjamanIds = peminjaman.map(p => p.detailPeminjamanId);
        const detailPeminjaman = await db
            .select()
            .from(detailPeminjamans)
            .where(inArray(detailPeminjamans.id, detailPeminjamanIds))
            .execute();

        return {
            statusCode: 200,
            message: "Success",
            data: detailPeminjaman
        };
    })
    .get('/all/ruangan/:id', {
        schema: {
            description: "Get all detailPeminjaman by ruangan id",
            tags: ["detailPeminjaman"],
            params: z.object({
                id: z.string()
            }),
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

        const { id } = req.params
        const numId = parseInt(id)

        if (!numId) {
            return {
                statusCode: 400,
                message: "Bad request"
            };
        }

        const peminjaman = await db
            .select()
            .from(peminjamans)
            .where(and(eq(peminjamans.ruanganId, numId), eq(peminjamans.category, "ruangan")))
            .execute()

        if (peminjaman.length === 0) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        const detailPeminjamanIds = peminjaman.map(p => p.detailPeminjamanId);
        const detailPeminjaman = await db
            .select()
            .from(detailPeminjamans)
            .where(inArray(detailPeminjamans.id, detailPeminjamanIds))
            .execute();

        return {
            statusCode: 200,
            message: "Success",
            data: detailPeminjaman
        };
    })
    .get('/all/kendaraan/:id', {
        schema: {
            description: "Get all detailPeminjaman by kendaraan id",
            tags: ["detailPeminjaman"],
            params: z.object({
                id: z.string()
            }),
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

        const { id } = req.params
        const numId = parseInt(id)

        if (!numId) {
            return {
                statusCode: 400,
                message: "Bad request"
            };
        }

        const peminjaman = await db
            .select()
            .from(peminjamans)
            .where(and(eq(peminjamans.kendaraanId, numId), eq(peminjamans.category, "kendaraan")))
            .execute()

        if (peminjaman.length === 0) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        const detailPeminjamanIds = peminjaman.map(p => p.detailPeminjamanId);
        const detailPeminjaman = await db
            .select()
            .from(detailPeminjamans)
            .where(inArray(detailPeminjamans.id, detailPeminjamanIds))
            .execute();

        return {
            statusCode: 200,
            message: "Success",
            data: detailPeminjaman
        };
    })
    .get('/all/draft/:id', {
        schema: {
            description: "Get all detailPeminjaman by draft id",
            tags: ["detailPeminjaman"],
            params: z.object({
                id: z.string()
            }),
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

        const { id } = req.params
        const numId = parseInt(id)

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
            .execute()
        
        if (peminjaman.length === 0) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        const items: Array<{ id: number, category: string }> = [];

        for (const p of peminjaman) {
            if (p.category === "barang") {
            const barang = await db.select().from(barangs).where(eq(barangs.id, p.barangId!)).execute();
            items.push({ ...barang[0], category: "barang" });
            } else if (p.category === "kendaraan") {
            const kendaraan = await db.select().from(kendaraans).where(eq(kendaraans.id, p.kendaraanId!)).execute();
            items.push({ ...kendaraan[0], category: "kendaraan" });
            } else if (p.category === "ruangan") {
            const ruangan = await db.select().from(ruangans).where(eq(ruangans.id, p.ruanganId!)).execute();
            items.push({ ...ruangan[0], category: "ruangan" });
            }
        }

        const allDetailPeminjamans = [];

        for (const item of items) {
            let itemPeminjamans: any[] = [];
            if (item.category === "barang") {
            itemPeminjamans = await db.select().from(peminjamans).where(eq(peminjamans.barangId, item.id)).execute();
            } else if (item.category === "kendaraan") {
            itemPeminjamans = await db.select().from(peminjamans).where(eq(peminjamans.kendaraanId, item.id)).execute();
            } else if (item.category === "ruangan") {
            itemPeminjamans = await db.select().from(peminjamans).where(eq(peminjamans.ruanganId, item.id)).execute();
            }

            for (const ip of itemPeminjamans) {
            const detailPeminjaman = await db.select().from(detailPeminjamans).where(eq(detailPeminjamans.id, ip.detailPeminjamanId)).execute();
            allDetailPeminjamans.push(detailPeminjaman[0]);
            }
        }

        return {
            statusCode: 200,
            message: "Success",
            data: allDetailPeminjamans
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

        return await checkItemsStatus();
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
             
        const userss = await db
            .select()
            .from(users)
            .where(eq(users.role, 'headOffice'));

        if (userss.length === 0) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        for (const user of userss) {
            const devicesToken = await db
                .select()
                .from(perangkats)
                .where(eq(perangkats.userId, user.id));

            if (devicesToken.length === 0) {
                continue;
            }

            let notificationInserted = false;

            for (const device of devicesToken) {
                const messages = {
                    notification: {
                    title: getNotificationTitleMessage('PP'),
                    body: getNotificationMessage('PP')
                    },
                    token: device.deviceToken
                };

                if (!notificationInserted) {
                    await db.insert(notifikasis)
                        .values({
                            userId: device.userId,
                            category: 'PP',
                            detailPeminjamanId: dp[0].id,
                            isRead: false,
                        });
                    notificationInserted = true;
                }

                getMessaging()
                .send(messages)
                .then((response) => {
                    console.log('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.log('Error sending message:', error);
                });
            }
        }
        
        return {
            statusCode: 200,
            message: "Success",
            data: dp[0]
        }
    })
    .patch("/pending", {
        schema: {
            description: "Update detailPeminjaman to pending",
            tags: ["detailPeminjaman"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            body: detailPeminjamanSchema.insert.omit({ createdAt: true, userId: true}).extend({
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
        
        const { borrowedDate, estimatedTime, returnDate, objective, destination, passenger, status, id } = req.body

        if (!id) {
            return {
                message: "Bad request",
                statusCode: 400
            }
        }

        const dp = await db.select()
            .from(detailPeminjamans)
            .where(and(eq(detailPeminjamans.id, id), eq(detailPeminjamans.userId, actor.id)))

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
                status,
                createdAt: new Date()
            })
            .where(eq(detailPeminjamans.id, id))
            .execute()

        await db.insert(logs).values({
            userId: actor.id,
            action: "Loan items",
            createdAt: new Date()
        }).execute();

        const userss = await db
            .select()
            .from(users)
            .where(eq(users.role, 'headOffice'));

        if (userss.length === 0) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        for (const user of userss) {
            const devicesToken = await db
                .select()
                .from(perangkats)
                .where(eq(perangkats.userId, user.id));

            if (devicesToken.length === 0) {
                continue;
            }

            let notificationInserted = false;

            for (const device of devicesToken) {
                const messages = {
                    notification: {
                    title: getNotificationTitleMessage('PP'),
                    body: getNotificationMessage('PP')
                    },
                    token: device.deviceToken
                };

                if (!notificationInserted) {
                    await db.insert(notifikasis)
                        .values({
                            userId: device.userId,
                            category: 'PP',
                            detailPeminjamanId: id,
                            isRead: false,
                    });
                    notificationInserted = true;
                }

                getMessaging()
                .send(messages)
                .then((response) => {
                    console.log('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.log('Error sending message:', error);
                });
            }
        }

        return {
            statusCode: 200,
            message: "Success",
        }
    })
    .patch("/canceled", {
        schema: {
            description: "Update detailPeminjaman to canceled",
            tags: ["detailPeminjaman"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            body: detailPeminjamanSchema.insert.pick({ id: true, canceledReason: true }),
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

        const { canceledReason, id } = req.body

        if (!id) {
            return {
                message: "Bad request",
                statusCode: 400
            }
        }
        
        const dp = await db.select()
            .from(detailPeminjamans)
            .where(and(eq(detailPeminjamans.id, id), eq(detailPeminjamans.userId, actor.id)))

        if (dp.length === 0) {
            return {
                message: "Not found",
                statusCode: 404
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
            .where(eq(detailPeminjamans.id, id))
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
    .patch("/approved", {
        schema: {
            description: "Update detailPeminjaman to approved",
            tags: ["detailPeminjaman"],
            // headers: z.object({
            //     authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            // }),
            body: detailPeminjamanSchema.insert.pick({ id: true }),
            response: {
                200: genericResponse(200),
                400: genericResponse(400),
                401: genericResponse(401),
                404: genericResponse(404)
            }
        }
    }, async (req) => {
        // const actor = await getUser(req.headers['authorization'], instance)

        // if (!actor) {
        //     return {
        //         message: "Unauthorized",
        //         statusCode: 401
        //     }
        // }

        const { id } = req.body

        if (!id) {
            return {
                message: "Bad request",
                statusCode: 400
            }
        }

        const dp = await db.select()
            .from(detailPeminjamans)
            .where(eq(detailPeminjamans.id, id))

        if (dp.length === 0) {
            return {
                message: "detailPeminjaman Not found",
                statusCode: 404
            }
        }

        // await db.insert(logs).values({
        //     userId: actor.id,
        //     action: `${actor.name} Accepted the loan request`,
        //     createdAt: new Date()
        // }).execute();

        await db.update(detailPeminjamans)
            .set({
                status: 'approved',
            })
            .where(eq(detailPeminjamans.id, id))
            .execute()

        var devicesToken = await db
            .select()
            .from(perangkats)
            .where(eq(perangkats.userId, dp[0].userId))

        if (devicesToken.length === 0) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        let notificationInserted = false;

        devicesToken.forEach(async (device) => {
            const messages = {
                notification: {
                    title: getNotificationTitleMessage('PD'),
                    body: getNotificationMessage('PD')
                },
                token: device.deviceToken
            };

            if (!notificationInserted) {
                await db.insert(notifikasis)
                    .values({
                        userId: dp[0].userId,
                        category: 'PD',
                        detailPeminjamanId: id,
                        isRead: false,
                    })
                    .execute();
                notificationInserted = true;
            }

            getMessaging()
                .send(messages)
                .then((response) => {
                    console.log('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.log('Error sending message:', error);
                });
            });

        return {
            statusCode: 200,
            message: "Success",
        }
    })
}
