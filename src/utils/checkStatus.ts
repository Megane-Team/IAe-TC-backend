import { barangs } from "@/models/barangs.ts";
import { detailPeminjamans } from "@/models/detailPeminjamans.ts";
import { kendaraans } from "@/models/kendaraans.ts";
import { notifikasis } from "@/models/notifikasis.ts";
import { peminjamans } from "@/models/peminjamans.ts";
import { perangkats } from "@/models/perangkat.ts";
import { ruangans } from "@/models/ruangans.ts";
import { db } from "@/modules/database.ts";
import { getNotificationMessage, getNotificationTitleMessage } from "@/routes/notifikasi.ts";
import { and, eq, lt } from "drizzle-orm";
import { getMessaging } from "firebase-admin/messaging";

export async function checkItemsStatus() {
    checkStatus();

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

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const pendingPeminjamans = await db
        .select()
        .from(detailPeminjamans)
        .where(and(eq(detailPeminjamans.status, "pending"), lt(detailPeminjamans.createdAt, twoDaysAgo)))
        .execute();

    for (const pending of pendingPeminjamans) {
        await db.update(detailPeminjamans)
            .set({
                status: "canceled",
                canceledReason: "Auto canceled after 2 days"
            })
            .where(eq(detailPeminjamans.id, pending.id))
            .execute();

        const devicesToken = await db
            .select()
            .from(perangkats)
            .where(eq(perangkats.userId, pending.userId))
            .execute();

        let notificationInserted = false;

        for (const device of devicesToken) {
            const messages = {
                notification: {
                    title: getNotificationTitleMessage('DO'),
                    body: getNotificationMessage('DO')
                },
                token: device.deviceToken
            };

            if (!notificationInserted) {
                await db.insert(notifikasis)
                    .values({
                        userId: device.userId,
                        category: 'DO',
                        detailPeminjamanId: pending.id,
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
        }
    }

    return {
        statusCode: 200,
        message: "Success",
    };
}

async function checkStatus() {
    try {
        const response = await fetch('http://192.168.1.112:8000/api/checkstatus', {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
