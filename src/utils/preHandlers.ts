import { FastifyRequest } from 'fastify';
import { getUser } from '@/utils/getUser.ts';

export const authorizeUser = async (req: FastifyRequest) => {
    const authorization = req.headers["authorization"];
    if (!authorization) return { statusCode: 401, message: "Unauthorized" };

    const actor = await getUser(authorization, req.server);
    if (!actor) return { statusCode: 401, message: "Unauthorized" };
};
