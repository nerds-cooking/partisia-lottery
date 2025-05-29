/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Joi from 'joi';

// Define the schema with types
export const validationSchema = Joi.object({
  MONGO_URI: Joi.string().uri().required(),
  PORT: Joi.number().default(3033),
  CSRF_SECRET: Joi.string().required(),
  CORS_ORIGIN: Joi.string().uri().required(),
  SESSION_SECRET: Joi.string().required(),
});

// Define a TypeScript interface for the validated config
export interface Config {
  MONGO_URI: string;
  PORT: number;
  CSRF_SECRET: string;
  CORS_ORIGIN: string;
  SESSION_SECRET: string;
}

// Validate function to validate config and return the correct type
export function validateConfig(config: Record<string, any>): Config {
  const { error, value } = validationSchema.validate(config);

  if (error) {
    // Throw an error when validation fails, with type-safe error handling
    throw new Error(`Config validation error: ${error.message}`);
  }

  // Return validated values with explicit type assertion
  return value as Config;
}
