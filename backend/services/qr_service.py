import os
import qrcode
from flask import current_app

def generate_pin():
    import random
    return f"{random.randint(100000, 999999)}"

def generate_qr_code(member_number):
    """Generate a high-resolution QR code PNG image for a given member number."""
    qr_dir = current_app.config['QR_FOLDER']
    os.makedirs(qr_dir, exist_ok=True)
    
    file_name = f"{member_number}.png"
    file_path = os.path.join(qr_dir, file_name)
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(member_number)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
    img.save(file_path)
    
    return f"uploads/qrcodes/{file_name}"
