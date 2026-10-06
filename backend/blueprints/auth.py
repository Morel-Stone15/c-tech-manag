import os
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, Member
from services.qr_service import generate_pin, generate_qr_code
from services.email_service import send_email_notification, log_action

auth_bp = Blueprint('auth', __name__)

def generate_member_number():
    year = datetime.now().year
    max_id = db.session.query(db.func.max(Member.id)).scalar() or 0
    count = Member.query.count()
    next_num = max(max_id, count) + 1
    
    while True:
        candidate = f"CT-{year}-{next_num:04d}"
        if not Member.query.filter_by(member_number=candidate).first():
            return candidate
        next_num += 1


@auth_bp.route('/api/register', methods=['POST'])
def register():
    """Register a member automatically with a 24h temporary initial PIN."""
    data = request.form if request.form else (request.json or {})
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    major = data.get('major')
    level = data.get('level')
    email = data.get('email')
    phone = data.get('phone')
    
    if not all([first_name, last_name, major, level, email, phone]):
        return jsonify({'error': 'Tous les champs sont requis.'}), 400
        
    if Member.query.filter_by(email=email).first():
        return jsonify({'error': 'Cet email est déjà enregistré.'}), 400

    photo_file = request.files.get('photo') if request.files else None
    photo_rel_path = None
    if photo_file:
        file_ext = os.path.splitext(photo_file.filename)[1]
        temp_filename = f"{email.replace('@', '_').replace('.', '_')}{file_ext}"
        filepath = os.path.join(current_app.config['PHOTO_FOLDER'], temp_filename)
        photo_file.save(filepath)
        photo_rel_path = f"uploads/photos/{temp_filename}"

    pin_code = generate_pin()
    member_no = generate_member_number()
    qr_rel_path = generate_qr_code(member_no)
    expires_at = datetime.utcnow() + timedelta(hours=24)

    new_member = Member(
        member_number=member_no,
        pin=generate_password_hash(pin_code),
        last_name=last_name,
        first_name=first_name,
        major=major,
        level=level,
        email=email,
        phone=phone,
        photo_path=photo_rel_path,
        qr_code_path=qr_rel_path,
        is_bureau=False,
        must_change_pin=True,
        pin_expires_at=expires_at
    )
    
    try:
        db.session.add(new_member)
        db.session.commit()
        
        try:
            send_email_notification(
                new_member,
                pin_code,
                subject_override="Bienvenue à C-TECH — Votre Code de Départ (Valable 24h)",
                greeting_override="Votre inscription à C-TECH a été validée avec succès !",
                action_label="Ce code de départ est valable 24h. Lors de votre première connexion, le système vous demandera de choisir votre code PIN personnel définitif.",
                extra_note="Veuillez utiliser ce code de départ dans les 24 heures pour vous connecter et créer votre PIN personnel."
            )
        except Exception as email_err:
            print(f"Non-fatal email sending warning: {email_err}")

        log_action("Système", f"Inscription automatique du membre {first_name} {last_name} ({member_no})")
        
        return jsonify({
            'message': 'Inscription réussie',
            'member': new_member.to_dict(),
            'pin': pin_code
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500


@auth_bp.route('/api/login', methods=['POST'])
def login():
    """Login via Member Number/Email + PIN."""
    data = request.json or {}
    member_input = str(data.get('member_number') or '').strip()
    pin = str(data.get('pin') or '').strip()
    
    if not member_input or not pin:
        return jsonify({'error': 'Veuillez saisir votre identifiant et votre code PIN.'}), 400
        
    member = Member.query.filter(
        (Member.member_number == member_input) | (Member.email == member_input)
    ).first()
    
    if not member:
        return jsonify({'error': 'Identifiant ou code PIN incorrect.'}), 401
        
    if not check_password_hash(member.pin, pin) and member.pin != pin:
        return jsonify({'error': 'Identifiant ou code PIN incorrect.'}), 401
        
    if member.status != 'actif':
        return jsonify({'error': f'Compte {member.status}. Veuillez contacter le Bureau.'}), 403

    if member.must_change_pin and member.pin_expires_at:
        if datetime.utcnow() > member.pin_expires_at:
            return jsonify({'error': 'Votre code de départ temporaire a expiré (24h). Veuillez contacter le Bureau.'}), 403

    log_action(f"{member.first_name} {member.last_name}", "Connexion à la plateforme C-TECH.")
    return jsonify({
        'message': 'Connexion réussie',
        'member': member.to_dict()
    }), 200


@auth_bp.route('/api/change_pin', methods=['POST'])
def change_pin():
    """Define permanent PIN."""
    data = request.json or {}
    member_id = data.get('member_id')
    old_pin = str(data.get('old_pin') or '').strip()
    new_pin = str(data.get('new_pin') or '').strip()
    
    if not member_id or not new_pin:
        return jsonify({'error': 'ID membre et nouveau PIN requis.'}), 400
        
    if len(new_pin) < 4:
        return jsonify({'error': 'Le nouveau code PIN doit comporter au moins 4 caractères.'}), 400
        
    member = Member.query.get_or_404(member_id)
    
    if old_pin and not check_password_hash(member.pin, old_pin) and member.pin != old_pin:
        return jsonify({'error': 'Ancien code PIN incorrect.'}), 400
        
    member.pin = generate_password_hash(new_pin)
    member.must_change_pin = False
    member.pin_expires_at = None
    db.session.commit()
    
    log_action(f"{member.first_name} {member.last_name}", "Changement du code PIN personnel effectué avec succès.")
    return jsonify({'message': 'Code PIN mis à jour avec succès !', 'member': member.to_dict()}), 200


@auth_bp.route('/api/forgot_pin', methods=['POST'])
def forgot_pin():
    """Request a new temporary PIN."""
    data = request.json or {}
    user_input = str(data.get('email') or '').strip()
    
    if not user_input:
        return jsonify({'error': 'Veuillez saisir votre email ou numéro de membre.'}), 400
        
    member = Member.query.filter(
        (Member.email == user_input) | (Member.member_number == user_input)
    ).first()
    
    if not member:
        return jsonify({'message': 'Si ce compte existe, un nouveau PIN lui a été envoyé.'}), 200

    new_pin = generate_pin()
    member.pin = generate_password_hash(new_pin)
    member.must_change_pin = True
    member.pin_expires_at = datetime.utcnow() + timedelta(hours=24)
    db.session.commit()

    try:
        send_email_notification(
            member,
            new_pin,
            subject_override="Réinitialisation de votre code PIN — C-TECH",
            greeting_override="Une demande de réinitialisation de votre code PIN a été effectuée.",
            action_label="Ce nouveau code de départ temporaire est valable 24h.",
            extra_note="Connectez-vous dans les 24h pour personnaliser votre code PIN définitif."
        )
    except Exception as e:
        print(f"Forgot PIN email warning: {e}")

    log_action("Système", f"Récupération de PIN demandée pour {member.first_name} {member.last_name} ({member.member_number})")
    return jsonify({'message': f'Nouveau code PIN envoyé à {member.email} !'}), 200
