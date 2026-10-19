import { env } from "../../config/env.js";

const { hostname, port } = new URL(env.REDIS_URL);
export const connection = { host: hostname, port: Number(port) || 6379 };
