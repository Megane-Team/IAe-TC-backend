import { genericResponse } from "@/constants.ts";
import { server } from "@/index.ts";
import { notifikasis, notifikasiSchema } from "@/models/notifikasis.ts";
import { perangkats } from "@/models/perangkat.ts";
import { users } from "@/models/users.ts";
import { db } from "@/modules/database.ts";
import { getUser } from "@/utils/getUser.ts";
import { eq } from "drizzle-orm";
import { getMessaging } from "firebase-admin/messaging";
import { z } from "zod";

export const getNotificationTitleMessage = (kategori: string): string => {
    switch (kategori) {
        case 'PB':
            return 'Peminjaman berhasil';
        case 'PD':
            return 'Peminjaman dikonfirmasi!';
        case 'PG':
            return 'Peminjaman gagal!';
        case 'PDB':
            return 'Peminjaman telah dibatalkan';
        case 'PDT':
            return 'Peminjaman ditolak!';
        case 'JT':
            return 'Waktu peminjaman akan segera berakhir!';
        case 'DO':
            return 'Peminjaman dibatalkan otomatis!';
        case 'PP':
            return 'Seseorang telah mengajukan peminjaman!';
        default:
            return 'Notifikasi tidak dikenal';
    }
};
export const getNotificationMessage = (kategori: string): string => {
    switch (kategori) {
        case 'PB':
            return 'Kamu berhasil mengajukan peminjaman!';
        case 'PD':
            return 'Peminjaman mu telah di konfirmasi!';
        case 'PG':
            return 'Pengajuan peminjaman mu gagal coba lagi nanti!';
        case 'PDB':
            return 'Kamu berhasil membatalkan pengajuan peminjamanmu!';
        case 'PDT':
            return 'Pengajuan peminjaman mu ditolak!';
        case 'JT':
            return 'Peminjaman mu sebentar lagi berakhir jangan lupa untuk mengembalikanya!';
        case 'DO':
            return 'Pengajuan peminjaman telah dibatalkan secara otomatis!';
        case 'PP':
            return 'Pengajuan peminjaman!';
        default:
            return 'Notifikasi tidak dikenal';
    }
};
export const prefix = "/notifikasi";
export const route = (instance: typeof server) => { instance
    .get("/", {
        schema: {
            description: "Get all notifications",
            tags: ["notifikasi"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: z.array(notifikasiSchema.select)
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

        const notif = await db
            .select()
            .from(notifikasis)
            .where(eq(notifikasis.userId, actor.id))

        if (!notif) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        return {
            statusCode: 200,
            message: "Success",
            data: notif
        };
    })
    .get("/updateRead/:id", {
        schema: {
            description: "Set isRead to true",
            tags: ["notifikasi"],
            params: z.object({
                id: z.string()
            }),
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200),
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
        const numId= parseInt(id);

        const notif = await db
            .update(notifikasis)
            .set({
                isRead: true
            })
            .where(eq(notifikasis.id, numId))

        if (!notif) {
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
    .post("/send/id/:id", {
        schema: {
            description: "Send notification to user id",
            tags: ["notifikasi"],
            params: z.object({
                id: z.string()
            }),
            body: notifikasiSchema.insert.pick({ category: true, detailPeminjamanId: true }),
            response: {
                200: genericResponse(200),
                401: genericResponse(401),
                404: genericResponse(404)
            }
        }
    }, async (req) => {
        const { id } = req.params;
        const numId = parseInt(id);

        var user = await db
            .select()
            .from(users)
            .where(eq(users.id, numId))

        if (!user) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        var { category, detailPeminjamanId } = req.body;
        
        var devicesToken = await db
            .select()
            .from(perangkats)
            .where(eq(perangkats.userId, user[0].id))

        if (devicesToken.length === 0) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        let notificationInserted = false;

        devicesToken.forEach((device) => {
            const messages = {
                notification: {
                    title: getNotificationTitleMessage(category?.toString() ?? ''),
                    body: getNotificationMessage(category?.toString() ?? '')
                },
                token: device.deviceToken
            };

            if (!notificationInserted) {
                db.insert(notifikasis)
                    .values({
                        userId: user[0].id,
                        category,
                        detailPeminjamanId,
                        isRead: false,
                    })
                    .execute();
                notificationInserted = true;
            }

            getMessaging()
                .send(messages)
                .then((response) => {
                    console.log('Successfully sent message:', response)
                })
                .catch((error) => {
                    console.log('Error sending message:', error)
                });
            })

        return {
            statusCode: 200,
            message: "Success"
        }
    })
    .post("/send/role/:role", {
        schema: {
            description: "Send notification to user id",
            tags: ["notifikasi"],
            params: z.object({
                role: z.string()
            }),
            body: notifikasiSchema.insert.pick({ category: true, detailPeminjamanId: true }),
            response: {
                200: genericResponse(200),
                401: genericResponse(401),
                404: genericResponse(404)
            }
        }
    }, async (req) => {
        const { role } = req.params;

        const userRole: "admin" | "user" | "headOffice" = role as "admin" | "user" | "headOffice";

        var user = await db
            .select()
            .from(users)
            .where(eq(users.role, userRole))

        if (!user) {
            return {
                statusCode: 404,
                message: "Not found"
            }
        }

        var { category, detailPeminjamanId } = req.body;
        
        var devicesToken = await db
            .select()
            .from(perangkats)
            .where(eq(perangkats.userId, user[0].id))

        if (devicesToken.length === 0) {
            return {
                statusCode: 404,
                message: "Not found"
            }
        }

        let notificationInserted = false;

        devicesToken.forEach((device) => {
            const messages = {
                notification: {
                    title: getNotificationTitleMessage(category?.toString() ?? ''),
                    body: getNotificationMessage(category?.toString() ?? '')
                },
                token: device.deviceToken
            };

            if (!notificationInserted) {
                db.insert(notifikasis)
                    .values({
                        userId: user[0].id,
                        category,
                        detailPeminjamanId,
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
            message: "Success"
        }
    })
} 
