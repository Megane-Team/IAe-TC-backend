import { genericResponse } from "@/constants.ts";
import { server } from "@/index.ts";
import { getUser } from "@/utils/getUser.ts";
import fs from "fs";
import { join } from "path";
import { z } from "zod";

export const prefix = "/photoFiles";
export const route = (instance: typeof server) => { instance
    .get("/tempat/:id", {
        schema: {
            description: "get all the tempat data",
            tags: ["tempats"],
            params: z.object({
                id: z.string()
            }),
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: z.any()
                })),

                401: genericResponse(401),
                404: genericResponse(404)
            }
        }
    }, async (req, reply) => {
        const actor = await getUser(req.headers["authorization"], instance);

        if (!actor) {
            return {
                statusCode: 401,
                message: "Unauthorized"
            };
        }
        
        const { id } = req.params;

        // check if file exists
        const path = join(import.meta.dirname, `../public/assets/tempat/${id}.jpg`)
        console.log(path)

        if (!fs.existsSync(path)) {
            return {
                statusCode: 404,
                message: "File not found"
            }
        }

        return reply.sendFile(`./tempat/${id}.jpg`)
    })

}
