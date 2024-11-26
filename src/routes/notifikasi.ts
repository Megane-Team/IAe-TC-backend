import { genericResponse } from "@/constants.ts";
import { server } from "@/index.ts";
import { notifikasis, notifikasiSchema } from "@/models/notifikasis.ts";
import { db } from "@/modules/database.ts";
import { getUser } from "@/utils/getUser.ts";
import { eq } from "drizzle-orm";
import { getMessaging } from "firebase-admin/messaging";
import { z } from "zod";

export const prefix = "/notifikasi";
export const route = (instance: typeof server) => { instance
    .get("/", {
        schema: {
            description: "Get all notifications",
            tags: ["notifikasi"],
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200).merge(z.object({
                    data: z.array(notifikasiSchema.select)
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

        const notif = await db
            .select()
            .from(notifikasis)
            .where(eq(notifikasis.userId, actor.id))

        if (!notif) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        return {
            statusCode: 200,
            message: "Success",
            data: notif
        };
    })
    .get("/updateRead/:id", {
        schema: {
            description: "Set isRead to true",
            tags: ["notifikasi"],
            params: z.object({
                id: z.string()
            }),
            headers: z.object({
                authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            }),
            response: {
                200: genericResponse(200),
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

        const { id } = req.params;
        const numId= parseInt(id);

        const notif = await db
            .update(notifikasis)
            .set({
                isRead: true
            })
            .where(eq(notifikasis.id, numId))

        if (!notif) {
            return {
                statusCode: 404,
                message: "Not found"
            };
        }

        return {
            statusCode: 200,
            message: "Success"
        };
    })
    .post("/send/:id", {
        schema: {
            description: "Send notification",
            tags: ["notifikasi"],
            params: z.object({
                id: z.string()
            }),
            // headers: z.object({
            //     authorization: z.string().transform((v) => v.replace("Bearer ", ""))
            // }),
            body: z.object({
                title: z.string(),
                message: z.string(),
                deviceToken: z.string()
            }),
            response: {
                200: genericResponse(200),
                401: genericResponse(401)
            }
        }
    }, async (req) => {
        // const actor = await getUser(req.headers["authorization"], instance);

        // if (!actor) {
        //     return {
        //         statusCode: 401,
        //         message: "Unauthorized"
        //     };
        // }

        const { id } = req.params;

        const message = {
            notification: {
                title: 'Notif',
                body: 'This is a notification'
            },
            token: req.body.deviceToken
        }

        getMessaging()
            .send(message)
            .then((response) => {
                console.log('Successfully sent message:', response);
            })
            .catch((error) => {
                console.log('Error sending message:', error);
            });

        return {
            statusCode: 200,
            message: "Success"
        };
    });
} 
