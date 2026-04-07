/* eslint-disable @typescript-eslint/no-namespace */

import { User } from 'src/db/schema';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      session: { selector: string; verifier: string; hashedVerifier: string };
    }
  }
}

export {};
