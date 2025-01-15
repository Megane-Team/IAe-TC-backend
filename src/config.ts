export const port = Number(process.env.PORT || 3000);
export const host = process.env.HOST || "127.0.0.1";
export const webUrl = process.env.WEB_URL;

export const databaseUrl = process.env.DATABASE_URL;
export const databaseMaxPool = Number(process.env.DATABASE_MAX_POOL || 50);

export const secretToken = process.env.JWT_SECRET;

if (!databaseUrl) {
    throw new Error("DATABASE_URL must be provided");
}
