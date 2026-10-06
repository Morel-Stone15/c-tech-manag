import os
import io
from flask import current_app
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.lib.utils import ImageReader

def generate_card_pdf(member):
    """Generate a high-definition ReportLab PDF virtual card for the member."""
    card_w = 85.6 * mm
    card_h = 54.0 * mm

    buf = io.BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=(card_w, card_h))

    # Background gradient simulation
    steps = 30
    for i in range(steps):
        t = i / steps
        r = int(5 + t * (26 - 5))
        g = int(11 + t * (10 - 11))
        b = int(24 + t * (46 - 24))
        c.setFillColorRGB(r/255, g/255, b/255)
        c.rect(0, (card_h / steps) * i, card_w, card_h / steps + 1, stroke=0, fill=1)

    # Holographic accent circles
    c.saveState()
    c.setFillColorRGB(0, 0.83, 1, alpha=0.08)
    c.circle(card_w * 0.85, card_h * 0.75, 28 * mm, stroke=0, fill=1)
    c.setFillColorRGB(0.49, 0.23, 0.93, alpha=0.10)
    c.circle(card_w * 0.12, card_h * 0.25, 22 * mm, stroke=0, fill=1)
    c.restoreState()

    # Border
    c.setStrokeColorRGB(0, 0.83, 1, alpha=0.4)
    c.setLineWidth(0.8)
    c.roundRect(1, 1, card_w - 2, card_h - 2, 5 * mm, stroke=1, fill=0)

    # Shimmer diagonal band
    c.saveState()
    c.setFillColorRGB(1, 1, 1, alpha=0.03)
    c.transform(1, 0, 0.5, 1, 0, 0)
    c.rect(-10, card_h * 0.4, card_w * 0.5, card_h * 0.15, stroke=0, fill=1)
    c.restoreState()

    # Card chip indicator
    chip_x, chip_y = 6 * mm, card_h - 14 * mm
    c.setStrokeColorRGB(0, 0.83, 1, alpha=0.8)
    c.setFillColorRGB(0, 0.83, 1, alpha=0.6)
    c.setLineWidth(0.6)
    for k in range(3):
        line_y = chip_y - k * 2.5
        w = 8 * mm if k < 2 else 5 * mm
        c.setFillColorRGB(0, 0.83, 1, alpha=0.7 - k * 0.15)
        c.roundRect(chip_x, line_y, w, 1.2, 0.5, stroke=0, fill=1)

    # C-TECH logo (top right)
    logo_path = os.path.join(current_app.config['BASE_DIR'], 'uploads', 'logo.png')
    if os.path.exists(logo_path):
        try:
            c.drawImage(ImageReader(logo_path), card_w - 22 * mm, card_h - 16 * mm, 18 * mm, 14 * mm, mask='auto', preserveAspectRatio=True)
        except Exception:
            c.setFillColorRGB(0, 0.83, 1)
            c.setFont("Helvetica-Bold", 10)
            c.drawRightString(card_w - 5 * mm, card_h - 9 * mm, "C-TECH")
    else:
        c.setFillColorRGB(0, 0.83, 1)
        c.setFont("Helvetica-Bold", 10)
        c.drawRightString(card_w - 5 * mm, card_h - 9 * mm, "C-TECH")

    # QR Code (bottom right)
    qr_size = 20 * mm
    qr_x = card_w - qr_size - 5 * mm
    qr_y = 5 * mm
    
    qr_rel = member.qr_code_path
    if not qr_rel or not os.path.exists(os.path.join(current_app.config['BASE_DIR'], qr_rel)):
        try:
            from services.qr_service import generate_qr_code
            qr_rel = generate_qr_code(member.member_number)
            member.qr_code_path = qr_rel
            from models import db
            db.session.commit()
        except Exception:
            qr_rel = None

    if qr_rel:
        qr_abs = os.path.join(current_app.config['BASE_DIR'], qr_rel)
        if os.path.exists(qr_abs):
            c.setFillColorRGB(1, 1, 1)
            c.roundRect(qr_x - 1.5, qr_y - 1.5, qr_size + 3, qr_size + 3, 2, stroke=0, fill=1)
            c.drawImage(ImageReader(qr_abs), qr_x, qr_y, qr_size, qr_size, mask='auto')
            c.setStrokeColorRGB(0, 0.83, 1, alpha=0.5)
            c.setLineWidth(0.5)
            c.roundRect(qr_x - 2, qr_y - 2, qr_size + 4, qr_size + 4, 2, stroke=1, fill=0)

    # Member photo
    if member.photo_path:
        photo_abs = os.path.join(current_app.config['BASE_DIR'], member.photo_path)
        if os.path.exists(photo_abs):
            ph_size = 14 * mm
            ph_x = (card_w - ph_size) / 2
            ph_y = card_h - ph_size - 6 * mm
            c.saveState()
            path = c.beginPath()
            path.circle(ph_x + ph_size / 2, ph_y + ph_size / 2, ph_size / 2)
            c.clipPath(path, stroke=0)
            c.drawImage(ImageReader(photo_abs), ph_x, ph_y, ph_size, ph_size, mask='auto')
            c.restoreState()
            c.setStrokeColorRGB(0, 0.83, 1, alpha=0.5)
            c.setLineWidth(0.6)
            c.circle(ph_x + ph_size / 2, ph_y + ph_size / 2, ph_size / 2 + 0.5, stroke=1, fill=0)

    # Member name
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 11)
    full_name = f"{member.first_name} {member.last_name}"
    c.drawString(5 * mm, 23 * mm, full_name[:28])

    # Major
    c.setFillColorRGB(0.6, 0.6, 0.75)
    c.setFont("Helvetica", 6.5)
    c.drawString(5 * mm, 19.5 * mm, (member.major or '')[:38])

    # Member number
    c.setFillColorRGB(0, 0.83, 1)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(5 * mm, 15.5 * mm, member.member_number)

    # Level badge
    level_text = member.level or ''
    badge_x = 5 * mm
    badge_y = 10.5 * mm
    badge_w = len(level_text) * 3.8 + 6
    c.setFillColorRGB(0, 0.83, 1, alpha=0.12)
    c.roundRect(badge_x, badge_y, badge_w, 6, 2, stroke=0, fill=1)
    c.setStrokeColorRGB(0, 0.83, 1, alpha=0.3)
    c.setLineWidth(0.4)
    c.roundRect(badge_x, badge_y, badge_w, 6, 2, stroke=1, fill=0)
    c.setFillColorRGB(0, 0.83, 1)
    c.setFont("Helvetica", 5.5)
    c.drawString(badge_x + 3, badge_y + 1.5, level_text)

    # Bottom decorative line
    c.setStrokeColorRGB(0, 0.83, 1, alpha=0.2)
    c.setLineWidth(0.4)
    c.line(5 * mm, 8 * mm, card_w - 5 * mm, 8 * mm)

    # Footer
    c.setFillColorRGB(0.4, 0.4, 0.55)
    c.setFont("Helvetica", 5)
    c.drawCentredString(card_w / 2, 4.5 * mm, "c-tech.org  ·  Carte Virtuelle Officielle")

    c.save()
    buf.seek(0)
    return buf
