import { genericResponse } from "@/constants.ts"
import { server } from "@/index.ts"
import { barangs, barangSchema } from "@/models/barangs.ts"
import { db } from "@/modules/database.ts"
import { getUser } from "@/utils/getUser.ts"
import { eq } from "drizzle-orm"
import { z } from "zod"

export const prefix = "/:id/barangs"
export const route = (instance: typeof server) => instance
    .get("/", {
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

        const res = await db
            .select()
            .from(barangs)
            .where(eq(barangs.ruanganId, numberId))
            .execute();

        return {
            statusCode: 200,
            message: "Success",
            data: res
        }
    });
