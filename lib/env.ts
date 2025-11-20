// Validate required environment variables at application startup
const requiredEnvs = ["DATABASE_URL", "NEXTAUTH_SECRET", "GEMINI_API_KEY"];

requiredEnvs.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export {};
