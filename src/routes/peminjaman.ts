import { genericResponse } from "@/constants.ts";
import { server } from "@/index.ts";
import { detailPeminjamans } from "@/models/detailPeminjamans.ts";
import { peminjamanCategory, peminjamans, peminjamanSchema} from "@/models/peminjamans.ts";
import { db } from "@/modules/database.ts";
import { getUser } from "@/utils/getUser.ts";
import { and, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";

export const prefix = "/peminjaman";
export const route = (instance: typeof server) => { instance
    .get("/", {
        schema: {
            description: "Get all peminjaman",
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
            .where(eq(detailPeminjamans.status, "draft"));

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
}
