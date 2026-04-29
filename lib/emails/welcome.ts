import 'server-only';
import { getResend, FROM_EMAIL } from '@/lib/resend';

interface WelcomeEmailArgs {
  to: string;
  firstName: string;
}

function buildWelcomeEmailHtml({ firstName }: { firstName: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://raffu.xyz';
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Welcome to Raffu</title>
  </head>
  <body style="margin:0; padding:0; background:#F5F0E8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#272727;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8; padding:48px 24px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; background:#FFFFFF; border:1px solid #E4DCCE; border-radius:12px; overflow:hidden;">
            <tr>
              <td style="padding:40px 40px 8px 40px;">
                <div style="display:inline-block; width:36px; height:36px; border-radius:50%; background:#E10A0A; color:#F5F0E8; text-align:center; line-height:36px; font-family: Georgia, serif; font-weight:900; font-size:16px;">R</div>
                <div style="font-family: Georgia, serif; font-weight:700; font-size:18px; margin-top:12px; letter-spacing:-0.02em;">Raffu</div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px 8px 40px;">
                <p style="font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#9E8E78; margin:0 0 16px 0;">Welcome</p>
                <h1 style="font-family: Georgia, serif; font-weight:700; font-size:32px; line-height:1.15; letter-spacing:-0.03em; margin:0 0 16px 0;">Hi ${firstName}, you're in.</h1>
                <p style="font-size:16px; line-height:1.65; margin:0 0 16px 0;">Your 30&#8209;day free trial has started. That's plenty of time to run your first few raffles &mdash; birthdays, launches, end&#8209;of&#8209;quarter socials, whatever you've got coming up.</p>
                <p style="font-size:16px; line-height:1.65; margin:0 0 24px 0;">Here's the shape of it:</p>
                <ol style="font-size:16px; line-height:1.7; margin:0 0 24px 20px; padding:0;">
                  <li>Set up a raffle &mdash; name it, brand it, decide how many winners.</li>
                  <li>Project the QR code. People scan, type their name, they're in.</li>
                  <li>Press draw. Names roll, winners emerge. Confetti.</li>
                </ol>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 40px 40px;">
                <a href="${appUrl}/dashboard" style="display:inline-block; background:#E10A0A; color:#F5F0E8; padding:14px 28px; border-radius:4px; text-decoration:none; font-weight:500; font-size:15px;">Open your dashboard</a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 32px 40px; border-top:1px solid #E4DCCE;">
                <p style="font-size:13px; line-height:1.6; color:#9E8E78; margin:0;">If the button doesn't work, paste this into your browser: <br><a href="${appUrl}/dashboard" style="color:#9E8E78;">${appUrl}/dashboard</a></p>
              </td>
            </tr>
          </table>
          <p style="font-size:12px; color:#9E8E78; margin:24px 0 0 0;">Sent with care from Raffu &middot; raffu.xyz</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendWelcomeEmail({ to, firstName }: WelcomeEmailArgs) {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Welcome to Raffu, ${firstName} — your trial has started`,
      html: buildWelcomeEmailHtml({ firstName }),
    });
    if (error) {
      console.error('Resend error', error);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    // Never throw from here — signup should succeed even if email fails.
    console.error('sendWelcomeEmail failed', err);
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}
