import type { StringValue } from 'ms';

export interface CommonConfig {
  memberInvitationExpiry: StringValue;
}

export const CommonConfig = {
  memberInvitationExpiry: process.env.MEMBER_INVITATION_EMAIL_EXPIRY,
};
