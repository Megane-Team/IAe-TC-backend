import { genericResponse } from "@/constants.ts"
import { server } from "@/index.ts"
import { barangs, barangSchema } from "@/models/barangs.ts"
import { db } from "@/modules/database.ts"
import { getUser } from "@/utils/getUser.ts"
import { eq } from "drizzle-orm"
import { z } from "zod"

export const prefix = "/barangs"
export const route = (instance: typeof server) => instance
    .get("/:id", {
        schema: {
            description: "get all the barang data",
            tags: ["barangs"],
            params: z.object({
                id: z.string(),
            }),
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: z.array(barangSchema.select.omit({ createdAt: true }))
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

        if (!id) {
            const res = await db
                .select()
                .from(barangs)
                .execute();

            return {
                statusCode: 200,
                message: "Success",
                data: res
            }
        } else {
            const res = await db
                .select()
                .from(barangs)
                .where(eq(barangs.id, numberId))
                .execute();

            return {
                statusCode: 200,
                message: "Success",
                data: res
            }
        }
    });
