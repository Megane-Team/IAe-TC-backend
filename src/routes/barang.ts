import { genericResponse } from "@/constants.ts"
import { server } from "@/index.ts"
import { barangs, barangSchema } from "@/models/barangs.ts"
import { db } from "@/modules/database.ts"
import { getUser } from "@/utils/getUser.ts"
import { eq } from "drizzle-orm"
import path from "path"
import { z } from "zod"
import fs from 'fs';

export const prefix = "/barangs"
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
                .execute();

            return {
                statusCode: 200,
                message: "Success",
                data: res
            }
    })
    .get("/:id", {
        schema: {
            description: "get the barang data by id",
            tags: ["barangs"],
            params: z.object({
                id: z.string(),
            }),
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: barangSchema.select.omit({ createdAt: true })
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
                .where(eq(barangs.id, numberId))
                .execute();

            return {
                statusCode: 200,
                message: "Success",
                data: res[0]
            }
    })
    .patch('/patch', {
        schema: {
            description: "update barang",
            tags: ["barangs"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Barier ", ""))
            }),
            body: barangSchema.select.omit({ createdAt: true }),
            response: {
                200: genericResponse(200),
                400: genericResponse(400),
                401: genericResponse(401),
                404: genericResponse(404)
            }
        }
    }, async (req) => {
        const actor = await getUser(req.headers["authorization"], instance)

        if (!actor) {
            return {
                message: "unauthorized",
                statusCode: 401
            }
        }

        const { id, name, code, status, condition, warranty, ruanganId, photo} = req.body

        const barang = await db
            .select()
            .from(barangs)
            .where(eq(barangs.id, id))

        if (barang.length == 0) {
            return {
                message: "Barang not found!",
                statusCode: 404
            }
        }

        await db.update(barangs)
            .set({
                name,
                code,
                status,
                condition,
                warranty,
                photo,
                ruanganId
            })
    })
