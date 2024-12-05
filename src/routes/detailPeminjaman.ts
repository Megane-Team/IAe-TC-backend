import { genericResponse } from "@/constants.ts"
import { server } from "@/index.ts"
import { detailPeminjamans, detailPeminjamanSchema } from "@/models/detailPeminjamans.ts"
import { db } from "@/modules/database.ts"
import { getUser } from "@/utils/getUser.ts"
import { eq, or } from "drizzle-orm"
import { z } from "zod"

export const prefix = '/detailPeminjaman'
export const route = (instance: typeof server) => { instance
    .get("/", {
        schema: {
            description: "Get all detail peminjaman",
            tags: ["detailPeminjaman"],
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

        const detailPeminjaman = await db
            .select()
            .from(detailPeminjamans)
            .where(or(
                eq(detailPeminjamans.status, "approved"), 
                eq(detailPeminjamans.status, "pending"), 
                eq(detailPeminjamans.status, "rejected"), 
                eq(detailPeminjamans.status, "returned"), 
                eq(detailPeminjamans.status, "canceled"),
            ));

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
}
