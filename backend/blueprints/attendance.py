from flask import Blueprint, request, jsonify
from models import db, Member, Attendance, CalendarEvent
from services.email_service import log_action

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('/api/attendance/scan', methods=['POST'])
def scan_attendance():
    """Scan a QR Code or member_number to log attendance."""
    data = request.json or {}
    member_number = str(data.get('member_number') or '').strip()
    event_name = str(data.get('event_name') or 'Événement Club Tech').strip()
    operator = data.get('operator', 'Scanner Bureau')
    
    if not member_number:
        return jsonify({'error': 'Numéro de membre requis.'}), 400
        
    member = Member.query.filter_by(member_number=member_number).first()
    if not member:
        return jsonify({'error': f'Aucun membre trouvé avec le numéro {member_number}.'}), 404

    calendar_event = CalendarEvent.query.filter_by(title=event_name).first()
    event_id = calendar_event.id if calendar_event else None
    
    attendance = Attendance(
        member_id=member.id,
        event_id=event_id,
        event_name=event_name
    )
    db.session.add(attendance)
    db.session.commit()
    
    log_action(operator, f"Scan présence de {member.first_name} {member.last_name} ({member.member_number}) à {event_name}")
    
    return jsonify({
        'message': f'Présence enregistrée avec succès pour {member.first_name} {member.last_name} !',
        'member': member.to_dict(),
        'attendance': attendance.to_dict()
    }), 201

@attendance_bp.route('/api/attendance', methods=['GET'])
def get_attendance_history():
    member_id = request.args.get('member_id')
    query = Attendance.query
    
    if member_id:
        query = query.filter_by(member_id=member_id)
        
    records = query.order_by(Attendance.scanned_at.desc()).limit(200).all()
    return jsonify([r.to_dict() for r in records]), 200
