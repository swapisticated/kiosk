import dotenv from "dotenv";
dotenv.config();

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Env variable ${key} not found`);
  }
  return value;
}

const env = {
  TURSO_DATABASE_URL: getEnvVar("TURSO_DATABASE_URL"),
  // GEMINI_API_KEY: getEnvVar("GEMINI_API_KEY"),
  TURSO_AUTH_TOKEN: getEnvVar("TURSO_AUTH_TOKEN"),
  JINA_API_KEY: getEnvVar("JINA_API_KEY"),
  PINECONE_API_KEY: getEnvVar("PINECONE_API_KEY"),
  GROQ_API_KEY: getEnvVar("GROQ_API_KEY"),
  WEB_CLIENT_SECRET: getEnvVar("WEB_CLIENT_SECRET"),
  WEB_CLIENT_ID: getEnvVar("WEB_CLIENT_ID"),
  DASHBOARD_SECRET: getEnvVar("DASHBOARD_SECRET"),
};

export default env;
