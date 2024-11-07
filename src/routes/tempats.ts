import { genericResponse } from "@/constants.ts";
import { server } from "@/index.ts";
import { tempats, tempatSchema } from "@/models/tempat.ts";
import { db } from "@/modules/database.ts";
import { getUser } from "@/utils/getUser.ts";
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
}
