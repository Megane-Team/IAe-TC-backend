import { genericResponse } from "@/constants.ts";
import { server } from "@/index.ts";
import { ruangans, ruanganSchema } from "@/models/ruangans.ts";
import { tempats, tempatSchema } from "@/models/tempat.ts";
import { db } from "@/modules/database.ts";
import { getUser } from "@/utils/getUser.ts";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const prefix = "/tempats";
export const route = (instance: typeof server) => { instance
    .get("/", {
        schema: {
            description: "get all the tempat data",
            tags: ["tempats"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: z.array(tempatSchema.select.omit({ createdAt: true }))
                })),

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

        const res = await db
            .select()
            .from(tempats)
            .execute();

        console.log(res);

        return {
            statusCode: 200,
            message: "Success",
            data: res
        };
    })
    .get('/:id/ruangans', {
        schema: {
            description: "get all the ruangan data by tempat id",
            tags: ["tempats"],
            params: z.object({
                id: z.string()
            }),
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: z.array(ruanganSchema.select.omit({ createdAt: true}))
                })),

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

        const { id } = req.params
        const numberId = Number(id);

        const res = await db
        .select()
        .from(ruangans)
        .where(eq(ruangans.id, numberId))

        return {
            statusCode: 200,
            message: 'Success',
            data: res
        }

    })
}
