import { genericResponse } from "@/constants.ts"
import { server } from "@/index.ts"
import { barangs, barangSchema } from "@/models/barangs.ts"
import { db } from "@/modules/database.ts"
import { getUser } from "@/utils/getUser.ts"
import { z } from "zod"

export const prefix = "/barang"
export const route = (instance: typeof server) => instance
    .get("/", {
        schema: {
            description: "get all the barang data",
            tags: ["barangs"],
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

        const res = await db
            .select()
            .from(barangs)
            .execute()

        return {
            statusCode: 200,
            message: "Success",
            data: res
        }
    });
