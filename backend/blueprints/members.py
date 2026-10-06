from flask import Blueprint, request, jsonify, send_file, current_app
from werkzeug.security import generate_password_hash
from models import db, Member
from services.qr_service import generate_pin
from services.pdf_service import generate_card_pdf
from services.email_service import send_email_notification, log_action

members_bp = Blueprint('members', __name__)

@members_bp.route('/api/members', methods=['GET'])
def get_all_members():
    query = Member.query
    search = request.args.get('search')
    major = request.args.get('major')
    level = request.args.get('level')
    
    if search:
        query = query.filter(
            (Member.first_name.ilike(f"%{search}%")) |
            (Member.last_name.ilike(f"%{search}%")) |
            (Member.email.ilike(f"%{search}%")) |
            (Member.member_number.ilike(f"%{search}%"))
        )
    if major:
        query = query.filter_by(major=major)
    if level:
        query = query.filter_by(level=level)
        
    members = query.order_by(Member.created_at.desc()).all()
    return jsonify([m.to_dict() for m in members]), 200

@members_bp.route('/api/members/<int:member_id>', methods=['GET'])
def get_member_profile(member_id):
    member = Member.query.get_or_404(member_id)
    return jsonify(member.to_dict()), 200

@members_bp.route('/api/members/<int:member_id>', methods=['PUT'])
def update_member_profile(member_id):
    member = Member.query.get_or_404(member_id)
    data = request.json or {}
    
    new_email = data.get('email')
    new_phone = data.get('phone')
    
    if new_email:
        existing = Member.query.filter_by(email=new_email).first()
        if existing and existing.id != member.id:
            return jsonify({'error': 'Cet email est déjà pris.'}), 400
        member.email = new_email
        
    if new_phone:
        member.phone = new_phone
        
    db.session.commit()
    log_action(f"{member.first_name} {member.last_name}", "Mise à jour des coordonnées personnelles.")
    return jsonify(member.to_dict()), 200

@members_bp.route('/api/members/<int:member_id>', methods=['DELETE'])
def delete_member(member_id):
    member = Member.query.get_or_404(member_id)
    operator = request.args.get('operator', 'Bureau')
    
    if member.member_number == "CT-ADMIN":
        return jsonify({'error': "Le compte administrateur principal ne peut pas être supprimé."}), 400
        
    db.session.delete(member)
    db.session.commit()
    log_action(operator, f"Suppression du membre {member.first_name} {member.last_name} ({member.member_number})")
    return jsonify({'message': 'Membre supprimé avec succès'}), 200

@members_bp.route('/api/members/<int:member_id>/reset_pin', methods=['POST'])
def reset_member_pin(member_id):
    member = Member.query.get_or_404(member_id)
    data = request.json or {}
    operator = data.get('operator', 'Bureau')
    
    from datetime import datetime, timedelta
    
    new_pin = generate_pin()
    member.pin = generate_password_hash(new_pin)
    member.must_change_pin = True
    member.pin_expires_at = datetime.utcnow() + timedelta(hours=24)
    db.session.commit()
    
    try:
        send_email_notification(
            member, new_pin,
            subject_override="Réinitialisation de votre code de départ — C-TECH",
            greeting_override=f"Votre code de connexion a été réinitialisé par le Bureau.",
            action_label="Un nouveau code de départ temporaire valable 24h vous a été généré.",
            extra_note="Connectez-vous dans les 24h pour définir votre nouveau code PIN personnel."
        )
    except Exception as e:
        print(f"Reset PIN email warning: {e}")
    
    log_action(operator, f"Réinitialisation du code PIN pour {member.first_name} {member.last_name} ({member.member_number})")
    return jsonify({'message': 'Code de départ réinitialisé avec succès (valable 24h)', 'pin': new_pin}), 200

@members_bp.route('/api/members/<int:member_id>/private_notes', methods=['PUT'])
def update_private_notes(member_id):
    member = Member.query.get_or_404(member_id)
    data = request.json or {}
    notes = data.get('notes', '')
    operator = data.get('operator', 'Bureau')
    
    member.private_notes = notes
    db.session.commit()
    log_action(operator, f"Mise à jour des notes privées pour {member.first_name} {member.last_name}")
    return jsonify(member.to_dict()), 200

@members_bp.route('/api/members/<int:member_id>/card_pdf', methods=['GET'])
def download_card_pdf(member_id):
    member = Member.query.get_or_404(member_id)
    try:
        pdf_buf = generate_card_pdf(member)
        pdf_buf.seek(0)
        return send_file(
            pdf_buf,
            as_attachment=True,
            download_name=f"Carte_C-TECH_{member.member_number}.pdf",
            mimetype='application/pdf'
        )
    except Exception as e:
        return jsonify({'error': f'Erreur génération PDF: {str(e)}'}), 500

@members_bp.route('/api/members/<int:member_id>/card_png', methods=['GET'])
def download_card_png(member_id):
    member = Member.query.get_or_404(member_id)
    try:
        import fitz # PyMuPDF
        import io
        pdf_buf = generate_card_pdf(member)
        pdf_buf.seek(0)
        doc = fitz.open("pdf", pdf_buf.read())
        page = doc[0]
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        png_buf = io.BytesIO(pix.tobytes("png"))
        png_buf.seek(0)
        return send_file(
            png_buf,
            as_attachment=True,
            download_name=f"Carte_C-TECH_{member.member_number}.png",
            mimetype='image/png'
        )
    except Exception as e:
        return jsonify({'error': f'Erreur génération PNG: {str(e)}'}), 500

@members_bp.route('/api/members/<int:member_id>/send_card_email', methods=['POST'])
def send_card_email(member_id):
    member = Member.query.get_or_404(member_id)
    data = request.json or {}
    operator = data.get('operator', 'Bureau')
    
    from datetime import datetime, timedelta
    
    new_pin = generate_pin()
    member.pin = generate_password_hash(new_pin)
    member.must_change_pin = True
    member.pin_expires_at = datetime.utcnow() + timedelta(hours=24)
    db.session.commit()

    success = send_email_notification(
        member,
        pin=new_pin,
        subject_override="Votre Carte Virtuelle C-TECH — Code de Départ (Valable 24h)",
        greeting_override=f"Voici votre carte virtuelle officielle C-TECH et votre code de départ.",
        action_label="Ce code de départ est valable 24 heures.",
        extra_note="Connectez-vous dans les 24h avec ce code pour choisir votre code PIN personnel.",
        attach_card_pdf=True
    )

    if success:
        log_action(operator, f"Envoi de la carte PDF par email à {member.first_name} {member.last_name} ({member.member_number}).")
        return jsonify({'message': f'Carte envoyée par email à {member.email} !'}), 200
    else:
        return jsonify({'error': 'Échec de l\'envoi email.'}), 500
