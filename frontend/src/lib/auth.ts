import { betterAuth } from "better-auth";
import { dash } from "@better-auth/infra";

export const auth = betterAuth({
    database: {
        dialect: "postgres",
        connectionString: import.meta.env.VITE_DATABASE_URL || "postgresql://neondb_owner:npg_NTJ9lv6cZuiL@ep-muddy-bonus-ayb4w3ar.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require",
    },
    secret: import.meta.env.VITE_BETTER_AUTH_SECRET || "ba_9lb5y5akzfwzaeddskwgdl77didhpw79",
    basePath: "/api/auth",
    plugins: [
        dash({
            apiKey: import.meta.env.VITE_BETTER_AUTH_API_KEY || "ba_9lb5y5akzfwzaeddskwgdl77didhpw79"
        })
    ],
    socialProviders: {
        google: {
            clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
            clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || "",
            redirectURI: (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api/auth/callback/google"
        }
    }
});
