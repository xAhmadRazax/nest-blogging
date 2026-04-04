import Joi from 'joi';
import { AuthConfig } from './auth.config';

export interface ConfigType {
  auth: AuthConfig;
}

export const appConfigSchema = Joi.object({
  DB_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  NODE_ENV: Joi.string().required(),
  JWT_EXPIRY: Joi.string().required(),
  REFRESH_TOKEN_EXPIRY: Joi.string().required(),
  EMAIL_VERIFICATION_TOKEN_EXPIRY: Joi.string().required(),
  PASSWORD_RESET_TOKEN_EXPIRY: Joi.string().required(),
});
