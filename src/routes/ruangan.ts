import { genericResponse } from "@/constants.ts";
import { server } from "@/index.ts";
import { barangs, barangSchema } from "@/models/barangs.ts";
import { ruangans, ruanganSchema } from "@/models/ruangans.ts";
import { db } from "@/modules/database.ts";
import { getUser } from "@/utils/getUser.ts";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const prefix = '/ruangans';
export const route = (instance: typeof server) => { instance
    .get("/" , {
        schema: {
            description: "Get ruangans",
            tags: ['Ruangan'],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: z.array(ruanganSchema.select.omit({ createdAt: true }))
                })),
                401: genericResponse(401),
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

        const res = await db
            .select()
            .from(ruangans)
            .execute();

        return {
            statusCode: 200,
            message: "Success",
            data: res
        }
    })
    .get("/:id" , {
        schema: {
            description: "Get ruangans",
            tags: ['Ruangan'],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            params: z.object({
                id: z.string()
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: z.array(ruanganSchema.select.omit({ createdAt: true }))
                })),
                401: genericResponse(401),
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
        const numberId = parseInt(id);

        const res = await db
                .select()
                .from(ruangans)
                .where(eq(ruangans.id, numberId))
                .execute();

        return {
            statusCode: 200,
            message: "Success",
            data: res
        }
    })
    .get('/:id/barangs', {
        schema: {
            description: "Get all barangs by ruangan id",
            tags: ['Ruangan'],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            params: z.object({
                id: z.string()
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: z.array(barangSchema.select.omit({ createdAt: true }))
                })),
                401: genericResponse(401),
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
        const numberId = parseInt(id);

        if (!numberId) {
            return {
                message: "Not found",
                statusCode: 404
            }
        }

        const res = await db
            .select()
            .from(barangs)
            .where(eq(barangs.ruanganId, numberId))
            .execute();

        console.log
        console.log(res)

        return {
            statusCode: 200,
            message: "Success",
            data: res
        }
    })
}
