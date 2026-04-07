import Joi from 'joi';
import { AuthConfig } from './auth.config';
import { EmailConfig } from './email.config';

export interface ConfigType {
  auth: AuthConfig;
  email: EmailConfig;
}

export const appConfigSchema = Joi.object({
  DB_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  NODE_ENV: Joi.string().required(),
  JWT_EXPIRY: Joi.string().required(),
  REFRESH_TOKEN_EXPIRY: Joi.string().required(),
  EMAIL_VERIFICATION_TOKEN_EXPIRY: Joi.string().required(),
  PASSWORD_RESET_TOKEN_EXPIRY: Joi.string().required(),
  EMAIL_API_KEY: Joi.string().required(),
  EMAIL_FROM_ADDRESS: Joi.string().required(),
  EMAIL_FROM_NAME: Joi.string().required(),
});
