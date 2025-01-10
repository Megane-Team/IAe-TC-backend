import fastify, { FastifyInstance } from "fastify";
import { serializerCompiler, validatorCompiler, ZodTypeProvider, jsonSchemaTransform } from "fastify-type-provider-zod";
import { readFileSync } from "fs";
import { readdir } from "fs/promises";
import { resolve } from "path";
import { port, host, databaseUrl, secretToken } from "./config.js";
import pg from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import status from "statuses";
import fjwt from '@fastify/jwt'
import fCookie from '@fastify/cookie'
import fstatic from '@fastify/static'
import fastifyMultipart from '@fastify/multipart'
import { initializeApp, applicationDefault } from "firebase-admin/app";
import cron from 'node-cron'
import { checkItemsStatus } from "./utils/checkStatus.ts";

initializeApp({
    credential: applicationDefault(),
    projectId: "inventara-backend-notification"
});

process.env.GOOGLE_APPLICATION_CREDENTIALS;

const server = fastify({
    logger: {
        transport: {
            targets: [{ target: "pino-pretty" }]
        }
    }
}).withTypeProvider<ZodTypeProvider>();

// multipart
server.register(fastifyMultipart)

try {
    server.log.warn("Migrating database...");
    const migrationClient = new pg.Client({ connectionString: databaseUrl });
    await migrationClient.connect();
    await migrate(drizzle(migrationClient, { casing: "snake_case" }), { migrationsFolder: `${process.cwd()}/drizzle` });
    server.log.warn("Database migrated successfully");
    
    await migrationClient.end();
}
catch (error) {
    server.log.error(error, "Failed to migrate database");
    process.exit(1);
}

const appMeta = JSON.parse(readFileSync(`${process.cwd()}/package.json`).toString()) as { name: string; version: string; description: string };

server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);
server.register(import("@fastify/compress"));
await server.register(import("@fastify/swagger"), {
    openapi: {
        info: {
            title: appMeta.name,
            version: appMeta.version,
            description: appMeta.description
        }
    },
    transform: jsonSchemaTransform
});
server.get("/openapi.json", { schema: { hide: true } }, () => server.swagger());
server.register(import("@scalar/fastify-api-reference"), {
    configuration: {
        spec: {
            url: "/openapi.json"
        }
    }
});

// TODO: Enable security headers
// server.register(import("@fastify/helmet"));
// server.register(import("@fastify/cors"));

const path = resolve(import.meta.dirname, "routes");
await readdir(path)
    .then(async (names) => {
        for (const name of names) {
            const { route, prefix } = await import(`file://${resolve(path, name)}`) as { route: (instance: FastifyInstance) => unknown; prefix: string };
            server.register((instance, _, done) => {
                route(instance);
                done();
            }, { prefix });
        }
    })
    .catch((err) => {
        server.log.error(err, "Failed to read routes directory");
        process.exit(1);
    });

server.addHook("preSerialization", async (req, rep, payload: Record<string, unknown>) => {
    // Correctly set the status code

    const { statusCode } = rep.status(payload.statusCode as number | null ?? rep.statusCode);

    const newPayload = {
        statusCode,
        message: payload.message ?? status(statusCode)
    };

    return { ...newPayload, ...payload };
});

// jwt
server.register(fjwt, { secret: secretToken as any})

server.addHook('preHandler', (req, res, next) => {
    // here we are    
    req.jwt = server.jwt
    return next()
})

// cookies
server.register(fCookie, {
    secret: secretToken,
    hook: 'preHandler',
})

// static
server.register(fstatic, {
    root: resolve(import.meta.dirname, 'public/assets'),
    prefix: '/public/', // optional: default '/'
    constraints: { host: 'localhost:3000' } // optional: default {}
})

// cron
cron.schedule('0 */3 * * *', async () => {
    console.log('Running checkItemsStatus every 3 hours');
    await checkItemsStatus();
});

server.listen({ port: port, host: host })
    .catch((error) => {
        server.log.error(error);
        process.exit(1);
    });

export type { server };
