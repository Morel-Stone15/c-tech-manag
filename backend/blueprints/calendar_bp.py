from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, CalendarEvent
from services.email_service import log_action

calendar_bp = Blueprint('calendar', __name__)

@calendar_bp.route('/api/calendar', methods=['GET'])
def get_events():
    events = CalendarEvent.query.order_by(CalendarEvent.event_date.asc()).all()
    return jsonify([e.to_dict() for e in events]), 200

@calendar_bp.route('/api/calendar', methods=['POST'])
def add_event():
    data = request.json or {}
    title = data.get('title')
    description = data.get('description', '')
    event_date_str = data.get('event_date')
    event_time = data.get('event_time', '')
    location = data.get('location', '')
    category = data.get('category', 'general')
    operator = data.get('operator', 'Bureau')

    if not title or not event_date_str:
        return jsonify({'error': 'Le titre et la date sont requis.'}), 400

    try:
        event_date = datetime.strptime(event_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Format de date invalide (AAAA-MM-JJ attendu).'}), 400

    event = CalendarEvent(
        title=title,
        description=description,
        event_date=event_date,
        event_time=event_time,
        location=location,
        category=category
    )
    db.session.add(event)
    db.session.commit()

    log_action(operator, f"Création de l'événement '{title}' le {event_date_str}")
    return jsonify(event.to_dict()), 201

@calendar_bp.route('/api/calendar/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    event = CalendarEvent.query.get_or_404(event_id)
    operator = request.args.get('operator', 'Bureau')
    title = event.title

    db.session.delete(event)
    db.session.commit()

    log_action(operator, f"Suppression de l'événement '{title}'")
    return jsonify({'message': 'Événement supprimé'}), 200
