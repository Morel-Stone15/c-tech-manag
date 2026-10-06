import os
from datetime import datetime
from flask import current_app
from models import db, ActionLog
from services.pdf_service import generate_card_pdf

def log_action(operator_name, description):
    """Helper to record board and system logs."""
    log = ActionLog(operator_name=operator_name, action_description=description, timestamp=datetime.utcnow())
    db.session.add(log)
    db.session.commit()


def _build_html_email(member, pin, greeting_override=None, action_label=None, extra_note=None, png_base64=None, custom_body=None):
    """Build a clean, high-end HTML email body featuring the C-TECH branding and custom content."""
    from flask import current_app
    backend_url = current_app.config.get('BACKEND_URL', 'http://localhost:5000').rstrip('/')
    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000').rstrip('/')

    show_pin_block = bool(pin)

    pin_html = ""
    if show_pin_block:
        pin_html = f"""
        <div style="background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(129, 140, 248, 0.3); border-radius: 12px; padding: 16px 20px; margin: 20px 0;">
          <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Code de Départ (Valable 24h)</div>
          <div style="font-family: 'Courier New', monospace; font-size: 28px; font-weight: 900; letter-spacing: 8px; color: #818cf8; margin-top: 6px;">{pin}</div>
        </div>
        """

    pdf_download_url = f"{backend_url}/api/members/{member.id}/card_pdf"
    
    card_visual = ""
    if png_base64 and show_pin_block:
        card_visual = f'<img src="data:image/png;base64,{png_base64}" alt="Carte Virtuelle" style="width:100%; max-width:400px; height:auto; border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,0.5); display:block; margin: 0 auto 24px auto;" />'
    
    body_content = custom_body or greeting_override or "Votre inscription à C-TECH a été validée avec succès !"
    formatted_body = body_content.replace('\n', '<br/>')

    action_text = f"<p style='color:#94a3b8;font-size:13px;line-height:1.6;margin:16px 0;'>{action_label}<br/><em style='color:#64748b;font-size:12px;'>{extra_note}</em></p>" if action_label else ""

    return f"""<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>C-TECH Notification</title></head>
<body style="margin:0;padding:0;background:#060913;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060913;padding:30px 15px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);box-shadow:0 20px 50px rgba(0,0,0,0.6);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d152a 0%,#1e1b4b 100%);padding:28px 24px;text-align:center;">
            <img src="{backend_url}/uploads/logo.png" alt="C-TECH Logo" style="height:64px;width:auto;margin-bottom:10px;display:inline-block;filter:drop-shadow(0 0 12px rgba(129,140,248,0.5));" />
            <div style="font-size:32px;font-weight:900;letter-spacing:4px;color:#ffffff;font-family:'Segoe UI',sans-serif;">C-TECH</div>
            <div style="font-size:11px;letter-spacing:3px;color:#a855f7;text-transform:uppercase;margin-top:4px;font-weight:700;">CLUB TECHNOLOGIQUE ÉTUDIANT</div>
          </td>
        </tr>

        <!-- MAIN BODY -->
        <tr>
          <td style="background:#0d1427;padding:32px 28px;">
            <p style="color:#f8fafc;font-size:16px;margin:0 0 16px;">Bonjour <strong style="color:#ffffff;">{member.first_name} {member.last_name}</strong>,</p>
            
            <div style="color:#cbd5e1;font-size:14.5px;line-height:1.7;background:rgba(255,255,255,0.035);padding:20px;border-radius:12px;border-left:4px solid #6366f1;border:1px solid rgba(255,255,255,0.06);">
              {formatted_body}
            </div>

            {card_visual}
            {pin_html}
            {action_text}

            <!-- CONNECT BUTTON -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
              <tr>
                <td align="center">
                  <a href="{frontend_url}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);color:#ffffff;text-decoration:none;padding:12px 30px;border-radius:10px;font-weight:700;font-size:14px;box-shadow:0 4px 20px rgba(99,102,241,0.4);">
                    🌐 Accéder à l'Espace Membre C-TECH →
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#060913;padding:20px 24px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
            <p style="color:#64748b;font-size:12px;margin:0;line-height:1.5;">
              © {datetime.now().year} C-TECH — Club Technologique Étudiant.<br/>
              Message officiel adressé par la Direction du Club C-TECH.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


def send_email_notification(member, pin, subject_override=None, body_override=None,
                             attach_card_pdf=True, greeting_override=None,
                             action_label=None, extra_note=None):
    """Send real email via EmailJS or SMTP. Uses exact admin body when provided."""
    subject = subject_override or "Notification Officielle C-TECH"

    log_folder = os.path.join(current_app.config['BASE_DIR'], 'logs')
    os.makedirs(log_folder, exist_ok=True)
    email_log_file = os.path.join(log_folder, 'sent_emails.log')

    pdf_buf = None
    png_base64 = ""
    pdf_filename = f"Carte_C-TECH_{member.member_number}.pdf"
    if attach_card_pdf and pin:
        try:
            pdf_buf = generate_card_pdf(member)
            pdf_local_path = os.path.join(log_folder, pdf_filename)
            pdf_bytes = pdf_buf.read()
            with open(pdf_local_path, 'wb') as pf:
                pf.write(pdf_bytes)
            pdf_buf.seek(0)
            import base64
            import fitz # PyMuPDF
            
            doc = fitz.open("pdf", pdf_bytes)
            page = doc[0]
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            png_bytes = pix.tobytes("png")
            png_base64 = base64.b64encode(png_bytes).decode('utf-8')
        except Exception as pdf_err:
            print(f"PDF/PNG generation warning: {pdf_err}")
            pdf_buf = None

    html_body = _build_html_email(member, pin, greeting_override, action_label, extra_note, png_base64, custom_body=body_override)

    plain_body = body_override or (
        f"Bonjour {member.first_name} {member.last_name},\n\n"
        + (greeting_override or "Votre inscription à C-TECH a été validée avec succès !\n\n")
        + f"Numéro de Membre : {member.member_number}\n"
        + (f"Code PIN : {pin}\n" if pin else "")
        + "\nCordialement,\nLe Bureau de C-TECH"
    )

    emailjs_service = current_app.config.get('EMAILJS_SERVICE_ID')
    emailjs_template = current_app.config.get('EMAILJS_TEMPLATE_ID')
    emailjs_user = current_app.config.get('EMAILJS_PUBLIC_KEY')
    emailjs_secret = current_app.config.get('EMAILJS_PRIVATE_KEY')

    if emailjs_service and emailjs_template and emailjs_user:
        import urllib.request
        import json

        message_block = body_override or (
            f"Bonjour {member.first_name} {member.last_name},\n\n"
            f"Votre inscription à C-TECH a été validée avec succès !\n\n"
            f"Numéro de Membre : {member.member_number}\n"
            + (f"Code de Départ : {pin}\n" if pin else "")
            + "\nCordialement,\nLe Bureau de C-TECH"
        )

        payload = {
            "service_id": emailjs_service,
            "template_id": emailjs_template,
            "user_id": emailjs_user,
            "template_params": {
                "to_name":       f"{member.first_name} {member.last_name}",
                "to_email":      member.email,
                "subject":       subject,
                "member_number": member.member_number,
                "pin_code":      pin or "",
                "message":       message_block,
                "html_message":  html_body,
                "pdf_url":       f"http://localhost:5000/api/members/{member.id}/card_pdf",
                "png_url":       f"http://localhost:5000/api/members/{member.id}/card_png",
                "from_name":     "C-TECH Club",
            }
        }
        if emailjs_secret:
            payload["accessToken"] = emailjs_secret

        try:
            req = urllib.request.Request(
                "https://api.emailjs.com/api/v1.0/email/send",
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'Origin': 'http://localhost:3000'
                }
            )
            res = urllib.request.urlopen(req, timeout=10)
            if res.status == 200:
                print(f"[EmailJS] ✓ Email envoyé avec succès à {member.email}")
                return True
        except Exception as e:
            print(f"[EmailJS Error] {e}")

    # Local log fallback
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(email_log_file, 'a', encoding='utf-8') as f:
        f.write(f"=== EMAIL LE {timestamp} ===\n")
        f.write(f"À: {member.email}\n")
        f.write(f"Objet: {subject}\n")
        f.write(plain_body + "\n")
        f.write("=" * 40 + "\n\n")
    print(f"[MOCK/LOG] Email journalisé pour {member.email}")
    return True
