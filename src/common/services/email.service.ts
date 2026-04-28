import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { TypeConfigService } from 'src/config/type.config.service';

@Injectable()
export class EmailService {
  private readonly apiKey: string;
  private readonly fromName: string;
  private readonly fromEmail: string;
  constructor(
    private readonly configService: TypeConfigService,
    private readonly httpService: HttpService,
    private readonly logger: Logger,
  ) {
    this.apiKey = this.configService.get('email', { infer: true })!.apiKey;

    this.fromEmail = this.configService.get('email', {
      infer: true,
    })!.fromAddress;

    this.fromName = this.configService.get('email', { infer: true })!.fromName;
  }

  private async sendEmail(payload: {
    to: [{ address: string; display_name: string }];
    subject: string;
    html: string;
  }) {
    const body = {
      ...payload,
      from: {
        address: this.fromEmail,
        display_name: this.fromName,
      },
    };

    return await this.httpService.axiosRef.post(
      'https://smtp.maileroo.com/api/v2/emails',
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey,
        },
      },
    );
  }

  async sendWelcomeAndVerificationEmail({
    url,
    recipientName,
    recipientAddress,
  }: {
    url: string;
    recipientName: string;
    recipientAddress: string;
  }) {
    const emailExpiry = this.configService
      .get('auth', { infer: true })!
      .tokensExpiry.emailVerificationTokenExpiry.toLocaleLowerCase();

    const expiryDuration = parseInt(emailExpiry);
    const expiryUnit = emailExpiry?.endsWith('h')
      ? 'hour'
      : emailExpiry?.endsWith('m')
        ? 'minute'
        : 'day';

    const payload = {
      subject: `Welcome to Nest Blogging`,
      html: `
      <!DOCTYPE html>
      <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta name="color-scheme" content="light dark">
            <meta name="supported-color-schemes" content="light dark">
            <style>
              :root { color-scheme: light dark; supported-color-schemes: light dark; }
              body { margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, system-ui, sans-serif; }
              .wrapper { width: 100%; table-layout: fixed; background-color: #0a0a0a; padding-bottom: 40px; }
              .main { max-width: 480px; margin: 40px auto; background-color: #111111; border: 1px solid #222; border-radius: 12px; padding: 40px; text-align: left; }
              h1 { color: #ffffff; font-size: 24px; font-weight: 700; margin-top: 0; }
              p { color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 20px 0; }
              .button { 
                display: inline-block; 
                background-color: #ffffff; 
                color: #000000 !important; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: 600; 
                font-size: 15px;
                width: 100%;
                text-align: center;
                box-sizing: border-box;
              }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #222; color: #52525b; font-size: 12px; }
              .link-fallback { color: #3b82f6; text-decoration: none; font-size: 13px; word-break: break-all; }
              @media (prefers-color-scheme: dark) {
                body, .wrapper { background-color: #000000 !important; }
                .main { background-color: #0a0a0a !important; border-color: #262626 !important; }
              }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="main">
                <div style="margin-bottom: 30px; font-weight: 800; color: #fff; font-size: 22px;">
                Nest Blogging
                </div>
                <h1>Welcome to Nest Blogging 👋</h1>
                <p>Hi ${recipientName},<br><br>Thanks for signing up! You're almost there — just verify your email address to activate your account and get started.</p>
                
                <a href="${url}" class="button">Verify Email</a>
                
                <p style="font-size: 14px; color: #71717a;">
                  If the button doesn't work, copy and paste this link:<br>
                  <a href="${url}" class="link-fallback">${url}</a>
                </p>
                
                <div class="footer">
                  This link expires in  ${expiryDuration > 1 ? `${expiryDuration} ${expiryUnit}s` : `${expiryDuration} ${expiryUnit}`}. If you didn't create an account, you can safely ignore this email.<br>
                  &copy; 2026 Nest Blogging.
                </div>
              </div>
            </div>
          </body>
          </html>
    `,
    };

    try {
      await this.sendEmail({
        ...payload,
        to: [{ address: recipientAddress, display_name: 'recipientName' }],
      });

      return { status: 'success', message: 'email has been send to the user' };
    } catch (error: unknown) {
      const err = error as AxiosError;
      this.logger.warn({
        errorType: 'Email Error',
        message:
          err.status === 429
            ? 'Email service is currently overloaded please try later'
            : 'Something went wrong while sending email',
      });

      return {
        status: 'error',
        message:
          err.status === 429
            ? 'Email service is currently overloaded please try later'
            : 'Something went wrong while sending email please try later',
      };
    }
  }

  async sendVerificationEmail({
    url,
    recipientName,
    recipientAddress,
  }: {
    url: string;
    recipientName: string;
    recipientAddress: string;
  }) {
    const emailExpiry = this.configService
      .get('auth', { infer: true })!
      .tokensExpiry.emailVerificationTokenExpiry.toLocaleLowerCase();

    const expiryDuration = parseInt(emailExpiry);
    const expiryUnit = emailExpiry?.endsWith('h')
      ? 'hour'
      : emailExpiry?.endsWith('m')
        ? 'minute'
        : 'day';

    const payload = {
      subject: `Verify your email - Nest Blogging`,
      html: `
      <!DOCTYPE html>
      <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta name="color-scheme" content="light dark">
            <meta name="supported-color-schemes" content="light dark">
            <style>
              :root { color-scheme: light dark; supported-color-schemes: light dark; }
              body { margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, system-ui, sans-serif; }
              .wrapper { width: 100%; table-layout: fixed; background-color: #0a0a0a; padding-bottom: 40px; }
              .main { max-width: 480px; margin: 40px auto; background-color: #111111; border: 1px solid #222; border-radius: 12px; padding: 40px; text-align: left; }
              h1 { color: #ffffff; font-size: 24px; font-weight: 700; margin-top: 0; }
              p { color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 20px 0; }
              .button { 
                display: inline-block; 
                background-color: #ffffff; 
                color: #000000 !important; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: 600; 
                font-size: 15px;
                width: 100%;
                text-align: center;
                box-sizing: border-box;
              }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #222; color: #52525b; font-size: 12px; }
              .link-fallback { color: #3b82f6; text-decoration: none; font-size: 13px; word-break: break-all; }
              @media (prefers-color-scheme: dark) {
                body, .wrapper { background-color: #000000 !important; }
                .main { background-color: #0a0a0a !important; border-color: #262626 !important; }
              }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="main">
              <div style="margin-bottom: 30px; font-weight: 800; color: #fff; font-size: 22px;">
                Nest Blogging
              </div>
              <h1>Verify your email</h1>
              <p>Hi ${recipientName},<br>Click the button below to verify your email address.</p>
            
            <a href="${url}" class="button">Verify Email</a>
                
                <p style="font-size: 14px; color: #71717a;">
                  If the button doesn't work, copy and paste this link:<br>
                  <a href="${url}" class="link-fallback">${url}</a>
                </p>
                
                <div class="footer">
                  This link expires in   ${expiryDuration > 1 ? `${expiryDuration} ${expiryUnit}s` : `${expiryDuration} ${expiryUnit}`}. If you didn't create an account, you can safely ignore this email.<br>
                  &copy; 2026 Nest Blogging.
                </div>
              </div>
            </div>
          </body>
          </html>
    `,
    };

    try {
      await this.sendEmail({
        ...payload,
        to: [{ address: recipientAddress, display_name: 'recipientName' }],
      });

      return { status: 'success', message: 'email has been send to the user' };
    } catch (error: unknown) {
      const err = error as AxiosError;
      this.logger.warn({
        errorType: 'Email Error',
        message:
          err.status === 429
            ? 'Email service is currently overloaded please try later'
            : 'Something went wrong while sending email',
      });

      return {
        status: 'error',
        message:
          err.status === 429
            ? 'Email service is currently overloaded please try later'
            : 'Something went wrong while sending email please try later',
      };
    }
  }

  async sendPasswordResetEmail({
    url,
    recipientName,
    recipientAddress,
  }: {
    url: string;
    recipientName: string;
    recipientAddress: string;
  }) {
    const passwordResetEmailExpiry = this.configService
      .get('auth', { infer: true })!
      .tokensExpiry.passwordResetsTokenExpiry.toLocaleLowerCase();

    const expiryDuration = parseInt(passwordResetEmailExpiry);
    const expiryUnit = passwordResetEmailExpiry?.endsWith('h')
      ? 'hour'
      : passwordResetEmailExpiry?.endsWith('m')
        ? 'minute'
        : 'day';

    const payload = {
      subject: 'Reset your password - Nest Blogging',
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <style>
          :root { color-scheme: light dark; supported-color-schemes: light dark; }
          body { margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, system-ui, sans-serif; }
          .wrapper { width: 100%; table-layout: fixed; background-color: #0a0a0a; padding-bottom: 40px; }
          .main { max-width: 480px; margin: 40px auto; background-color: #111111; border: 1px solid #222; border-radius: 12px; padding: 40px; text-align: left; }
          h1 { color: #ffffff; font-size: 24px; font-weight: 700; margin-top: 0; }
          p { color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 20px 0; }
          .button { 
            display: inline-block; 
            background-color: #ffffff; 
            color: #000000 !important; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 15px;
            width: 100%;
            text-align: center;
            box-sizing: border-box;
          }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #222; color: #52525b; font-size: 12px; }
          .link-fallback { color: #3b82f6; text-decoration: none; font-size: 13px; word-break: break-all; }
          
          @media (prefers-color-scheme: dark) {
            body, .wrapper { background-color: #000000 !important; }
            .main { background-color: #0a0a0a !important; border-color: #262626 !important; }
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="main">
          <div style="margin-bottom: 30px; font-weight: 800; color: #fff; font-size: 22px;">
              Nest Blogging
         </div>
        <h1>Reset your password</h1>
        <p>Hi ${recipientName},<br>We received a request to reset your password. Click the button below to choose a new one.</p>
          <a href="${url}" class="button">Reset Password</a> 
            <p style="font-size: 14px; color: #71717a;">
              If the button doesn't work, copy and paste this link:<br>
              <a href="${url}" class="link-fallback">${url}</a>
            </p>
            <div class="footer">
              This link expires in  ${expiryDuration > 1 ? `${expiryDuration} ${expiryUnit}s` : `${expiryDuration} ${expiryUnit}`}. If you didn't create an account, you can safely ignore this email.<br>
              &copy; 2026 Nest Blogging.
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    };

    try {
      await this.sendEmail({
        ...payload,
        to: [{ address: recipientAddress, display_name: 'recipientName' }],
      });

      return { status: 'success', message: 'email has been send to the user' };
    } catch (error: unknown) {
      const err = error as AxiosError;
      this.logger.warn({
        errorType: 'Email Error',
        message:
          err.status === 429
            ? 'Email service is currently overloaded please try later'
            : 'Something went wrong while sending email',
      });

      return {
        status: 'error',
        message:
          err.status === 429
            ? 'Email service is currently overloaded please try later'
            : 'Something went wrong while sending email please try later',
      };
    }
  }

  async sendMemberInvitationEmail({
    url,
    recipientName,
    roleName,
    publicationName,
    recipientAddress,
  }: {
    url: string;
    recipientName: string;
    recipientAddress: string;
    roleName: string;
    publicationName: string;
  }) {
    const emailExpiry = this.configService
      .get('auth', { infer: true })!
      .tokensExpiry.emailVerificationTokenExpiry.toLocaleLowerCase();

    const expiryDuration = parseInt(emailExpiry);
    const expiryUnit = emailExpiry?.endsWith('h')
      ? 'hour'
      : emailExpiry?.endsWith('m')
        ? 'minute'
        : 'day';

    const payload = {
      subject: `You're invited to join ${publicationName}`,
      html: `
<!DOCTYPE html>
<html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <style>
        :root { color-scheme: light dark; supported-color-schemes: light dark; }
        body { margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, system-ui, sans-serif; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #0a0a0a; padding-bottom: 40px; }
        .main { max-width: 480px; margin: 40px auto; background-color: #111111; border: 1px solid #222; border-radius: 12px; padding: 40px; text-align: left; }
        h1 { color: #ffffff; font-size: 24px; font-weight: 700; margin-top: 0; }
        p { color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 20px 0; }
        .button { 
          display: inline-block; 
          background-color: #ffffff; 
          color: #000000 !important; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600; 
          font-size: 15px;
          width: 100%;
          text-align: center;
          box-sizing: border-box;
        }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #222; color: #52525b; font-size: 12px; }
        .link-fallback { color: #3b82f6; text-decoration: none; font-size: 13px; word-break: break-all; }
        @media (prefers-color-scheme: dark) {
          body, .wrapper { background-color: #000000 !important; }
          .main { background-color: #0a0a0a !important; border-color: #262626 !important; }
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="main">
        <div style="margin-bottom: 30px; font-weight: 800; color: #fff; font-size: 22px;">
          Nest Blogging
        </div>

        <h1>You're invited</h1>

        <p>
          Hi ${recipientName},<br>
          You've been invited to join <strong>${publicationName}</strong> as a <strong>${roleName}</strong>.
        </p>

        <a href="${url}" class="button">Accept Invitation</a>
            
          <p style="font-size: 14px; color: #71717a;">
            If the button doesn't work, copy and paste this link:<br>
            <a href="${url}" class="link-fallback">${url}</a>
          </p>
          
          <div class="footer">
            This invitation expires in ${expiryDuration > 1 ? `${expiryDuration} ${expiryUnit}s` : `${expiryDuration} ${expiryUnit}`}.
            If you weren't expecting this invite, you can safely ignore this email.<br>
            &copy; 2026 Nest Blogging.
          </div>
        </div>
      </div>
    </body>
</html>
`,
    };

    try {
      await this.sendEmail({
        ...payload,
        to: [{ address: recipientAddress, display_name: 'recipientName' }],
      });

      return { status: 'success', message: 'email has been send to the user' };
    } catch (error: unknown) {
      const err = error as AxiosError;
      this.logger.warn({
        errorType: 'Email Error',
        message:
          err.status === 429
            ? 'Email service is currently overloaded please try later'
            : 'Something went wrong while sending email',
      });

      return {
        status: 'error',
        message:
          err.status === 429
            ? 'Email service is currently overloaded please try later'
            : 'Something went wrong while sending email please try later',
      };
    }
  }
}
