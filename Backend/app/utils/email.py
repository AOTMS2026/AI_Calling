import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def send_smtp_email(to_email: str, subject: str, html_content: str):
    try:
        host = settings.BREVO_SMTP_HOST
        port = int(settings.BREVO_SMTP_PORT)
        user = settings.BREVO_SMTP_USER
        password = settings.BREVO_SMTP_PASS
        sender = settings.BREVO_SMTP_FROM

        if not user or not password:
            print("[Email Warning] BREVO_SMTP_USER or BREVO_SMTP_PASS is not configured. Skipping email dispatch.")
            return False

        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = sender
        message["To"] = to_email

        part = MIMEText(html_content, "html")
        message.attach(part)

        with smtplib.SMTP(host, port, timeout=12) as server:
            server.starttls()
            server.login(user, password)
            server.sendmail(sender, to_email, message.as_string())
        
        print(f"[Email Success] Sent email successfully to {to_email} via Brevo SMTP.")
        return True
    except Exception as e:
        print(f"[Email Failure] Failed to send email to {to_email} via Brevo SMTP: {e}")
        return False

def get_otp_html_template(name: str, otp: str, purpose: str = "Account Registration") -> str:
    lead_text = "Thank you for creating an account with AOTMS. To finalize your deployment workspace configuration, please verify your email address using the secure code below:"
    if "Reset" in purpose:
        lead_text = "We received a request to reset the password for your AOTMS account. Use the verification code below to establish a new password credential:"

    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>AOTMS Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a;">
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="500px" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; max-width: 500px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #0f172a; padding: 24px; text-align: center;">
                            <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.025em;">AOTMS TELECOM</h2>
                            <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">Autonomous AI Call Center Infrastructure</p>
                        </td>
                    </tr>
                    
                    <!-- Content Body -->
                    <tr>
                        <td style="padding: 40px 32px;">
                            <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 700;">Hello {name},</h3>
                            <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                                {lead_text}
                            </p>
                            
                            <!-- OTP Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                                <tr>
                                    <td align="center">
                                        <div style="background-color: #f1f5f9; border-radius: 16px; padding: 18px 40px; display: inline-block; border: 1px solid #cbd5e1;">
                                            <span style="font-family: monospace; font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: 0.25em; padding-left: 0.25em;">{otp}</span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 16px 0; color: #ef4444; font-size: 11px; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: 0.05em;">
                                This security verification code will expire in 10 minutes.
                            </p>
                            
                            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0 20px 0;">
                            
                            <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                                If you did not trigger this dispatch request, you can safely ignore this security notification.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
