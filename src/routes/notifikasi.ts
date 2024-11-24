import { genericResponse } from "@/constants.ts";
import { server } from "@/index.ts";
import { getUser } from "@/utils/getUser.ts";
import { getMessaging } from "firebase-admin/messaging";
import { z } from "zod";

export const prefix = "/notifikasi";
export const route = (instance: typeof server) => { instance
    .post("/send", {
        schema: {
            description: "Send notification",
            tags: ["notifikasi"],
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
