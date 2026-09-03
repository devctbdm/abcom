import "server-only";

/**
 * Transactional email via the Resend REST API.
 * Set RESEND_API_KEY / RESEND_FROM in .env — never on the client.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

function renderResetEmailHtml(resetUrl: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
            <tr>
              <td style="background-color:#0f172a;padding:24px 32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:bold;">FuelRide</span>
                <span style="color:#94a3b8;font-size:12px;margin-left:8px;">Fleet &amp; Fiber Manager</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">Reset your password</h1>
                <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#475569;">
                  We received a request to reset the password for your FuelRide account.
                  Click the button below to choose a new password.
                </p>
                <p style="margin:0 0 24px;">
                  <a href="${resetUrl}"
                     style="display:inline-block;background-color:#ea580c;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:8px;">
                    Reset password
                  </a>
                </p>
                <p style="margin:0 0 8px;font-size:12px;line-height:20px;color:#94a3b8;">
                  This link expires in <b>1 hour</b> and can be used only once.
                </p>
                <p style="margin:0;font-size:12px;line-height:20px;color:#94a3b8;word-break:break-all;">
                  Or copy this link into your browser:<br>
                  <a href="${resetUrl}" style="color:#ea580c;">${resetUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background-color:#f8fafc;border-top:1px solid #e4e4e7;">
                <p style="margin:0;font-size:12px;color:#94a3b8;">
                  If you did not request a password reset, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Email is not configured — RESEND_API_KEY is missing.");
  }

  const from =
    process.env.RESEND_FROM?.trim() || "FuelRide <onboarding@resend.dev>";

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Reset your FuelRide password",
      html: renderResetEmailHtml(resetUrl),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend failed (${res.status}): ${body.slice(0, 300)}`);
  }
}
