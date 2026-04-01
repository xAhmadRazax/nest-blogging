import { JwtPayload } from 'jsonwebtoken';

export interface PayloadType extends JwtPayload {
  email: string;
  sub: string;
}
