import { genericResponse } from "@/constants.ts";
import { server } from "@/index.ts";
import { kendaraans, kendaraanSchema } from "@/models/kendaraans.ts";
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
                    data: tempatSchema.select.omit({ id: true, createdAt: true })
                        .merge(z.object({
                            ruangan: z.array(ruanganSchema.select.omit({ id: true, createdAt: true })),
                            kendaraan: z.array(kendaraanSchema.select.omit({ id: true, createdAt: true }))
                        }))
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
            .leftJoin(ruangans, eq(tempats.id, ruangans.tempatId))
            .leftJoin(kendaraans, eq(tempats.id, kendaraans.tempatId))
            .execute();

        console.log(res);

        return {
            statusCode: 200,
            message: "Success",
            data: { results: res }
        };
    })
}
