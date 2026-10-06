import os
import uuid
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from models import db, InternalDiscussion, Member, UserStatus, ChatGroup, ChatGroupMember
from services.email_service import send_email_notification, log_action

discussion_bp = Blueprint('discussion', __name__)

def detect_attachment_type(filename):
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']: return 'image'
    if ext in ['mp4', 'mov', 'avi', 'mkv', 'webm']: return 'video'
    if ext in ['mp3', 'wav', 'ogg', 'm4a']: return 'audio'
    if ext in ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'zip']: return 'document'
    return 'file'

@discussion_bp.route('/api/discussion', methods=['GET'])
def get_messages():
    m_id = request.args.get('member_id')
    other_id = request.args.get('other_id')
    group_id = request.args.get('group_id')
    limit = int(request.args.get('limit', 100))

    query = InternalDiscussion.query

    if group_id:
        query = query.filter_by(group_id=int(group_id))
    elif m_id and other_id:
        m1 = int(m_id)
        m2 = int(other_id)
        query = query.filter(
            ((InternalDiscussion.member_id == m1) & (InternalDiscussion.receiver_id == m2)) |
            ((InternalDiscussion.member_id == m2) & (InternalDiscussion.receiver_id == m1))
        )
    elif m_id:
        query = query.filter(
            (InternalDiscussion.receiver_id.is_(None)) & (InternalDiscussion.group_id.is_(None))
        )
    else:
        query = query.filter(
            (InternalDiscussion.receiver_id.is_(None)) & (InternalDiscussion.group_id.is_(None))
        )

    messages = query.order_by(InternalDiscussion.created_at.asc()).limit(limit).all()
    return jsonify([m.to_dict() for m in messages]), 200

@discussion_bp.route('/api/discussion', methods=['POST'])
def post_message():
    if request.content_type and 'multipart/form-data' in request.content_type:
        member_id = request.form.get('member_id')
        receiver_id = request.form.get('receiver_id')
        group_id = request.form.get('group_id')
        message_text = request.form.get('message', '').strip()
        file = request.files.get('file')
    else:
        data = request.json or {}
        member_id = data.get('member_id')
        receiver_id = data.get('receiver_id')
        group_id = data.get('group_id')
        message_text = (data.get('message') or '').strip()
        file = None

    if not member_id:
        return jsonify({'error': 'member_id requis.'}), 400
    if not message_text and not file:
        return jsonify({'error': 'Message ou fichier requis.'}), 400

    member = Member.query.get(int(member_id))
    if not member:
        return jsonify({'error': 'Membre expéditeur introuvable.'}), 404

    attachment_path = None
    attachment_type = None
    attachment_name = None

    if file and file.filename:
        attachment_name = file.filename
        attachment_type = detect_attachment_type(file.filename)
        chat_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'chat_media')
        os.makedirs(chat_folder, exist_ok=True)
        ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else 'bin'
        safe_name = f"{uuid.uuid4().hex}.{ext}"
        save_path = os.path.join(chat_folder, safe_name)
        file.save(save_path)
        attachment_path = f"uploads/chat_media/{safe_name}"

    msg = InternalDiscussion(
        member_id=int(member_id),
        receiver_id=int(receiver_id) if receiver_id else None,
        group_id=int(group_id) if group_id else None,
        message=message_text or None,
        attachment_path=attachment_path,
        attachment_type=attachment_type,
        attachment_name=attachment_name
    )

    try:
        db.session.add(msg)
        db.session.commit()
        return jsonify(msg.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur envoi message: {str(e)}'}), 500

@discussion_bp.route('/api/discussion/groups', methods=['GET'])
def get_chat_groups():
    m_id = request.args.get('member_id')
    if m_id:
        group_ids = [gm.group_id for gm in ChatGroupMember.query.filter_by(member_id=int(m_id)).all()]
        groups = ChatGroup.query.filter(ChatGroup.id.in_(group_ids)).all() if group_ids else []
    else:
        groups = ChatGroup.query.all()
    return jsonify([g.to_dict() for g in groups]), 200

@discussion_bp.route('/api/discussion/groups', methods=['POST'])
def create_chat_group():
    data = request.json or {}
    name = (data.get('name') or '').strip()
    description = (data.get('description') or '').strip()
    created_by_id = data.get('created_by_id')
    member_ids = data.get('member_ids', [])

    if not name:
        return jsonify({'error': 'Nom du groupe requis.'}), 400

    try:
        group = ChatGroup(name=name, description=description, created_by_id=created_by_id)
        db.session.add(group)
        db.session.commit()

        all_members = set(member_ids)
        if created_by_id:
            all_members.add(created_by_id)

        for mid in all_members:
            m_link = ChatGroupMember(group_id=group.id, member_id=mid)
            db.session.add(m_link)
        db.session.commit()

        log_action("Système", f"Création du groupe de discussion: {name}")
        return jsonify(group.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur création groupe: {str(e)}'}), 500

@discussion_bp.route('/api/discussion/statuses', methods=['GET'])
def get_statuses():
    since = datetime.utcnow() - timedelta(hours=24)
    statuses = UserStatus.query.filter(UserStatus.created_at >= since).order_by(UserStatus.created_at.desc()).all()
    return jsonify([s.to_dict() for s in statuses]), 200

@discussion_bp.route('/api/discussion/statuses', methods=['POST'])
def post_status():
    if request.content_type and 'multipart/form-data' in request.content_type:
        member_id = request.form.get('member_id')
        content = request.form.get('content', '').strip()
        bg_color = request.form.get('bg_color', '#6366f1')
        file = request.files.get('file')
    else:
        data = request.json or {}
        member_id = data.get('member_id')
        content = (data.get('content') or '').strip()
        bg_color = data.get('bg_color', '#6366f1')
        file = None

    if not member_id:
        return jsonify({'error': 'member_id requis.'}), 400
    if not content and not file:
        return jsonify({'error': 'Contenu du statut requis.'}), 400

    media_path = None
    media_type = 'text'

    if file and file.filename:
        media_type = detect_attachment_type(file.filename)
        status_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'statuses')
        os.makedirs(status_folder, exist_ok=True)
        ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else 'bin'
        safe_name = f"{uuid.uuid4().hex}.{ext}"
        save_path = os.path.join(status_folder, safe_name)
        file.save(save_path)
        media_path = f"uploads/statuses/{safe_name}"

    try:
        new_status = UserStatus(
            member_id=int(member_id),
            content=content or None,
            media_path=media_path,
            media_type=media_type,
            bg_color=bg_color
        )
        db.session.add(new_status)
        db.session.commit()
        return jsonify(new_status.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur publication statut: {str(e)}'}), 500

@discussion_bp.route('/api/send_mass_email', methods=['POST'])
def send_mass_email():
    data = request.json or {}
    subject = data.get('subject')
    body = data.get('body')
    major_filter = data.get('major')
    level_filter = data.get('level')
    operator = data.get('operator', 'Bureau')
    
    if not subject or not body:
        return jsonify({'error': 'Sujet et contenu requis.'}), 400
        
    query = Member.query
    if major_filter:
        query = query.filter_by(major=major_filter)
    if level_filter:
        query = query.filter_by(level=level_filter)
        
    targets = query.all()
    count = 0
    
    for member in targets:
        if member.member_number == "CT-ADMIN" and not (major_filter or level_filter):
            continue
        success = send_email_notification(member, None, subject_override=subject, body_override=body)
        if success:
            count += 1
            
    log_action(operator, f"Envoi d'un email groupé à {count} membres. Filtres: filière={major_filter}, niveau={level_filter}")
    return jsonify({'message': f'Email groupé envoyé à {count} membres.'}), 200
