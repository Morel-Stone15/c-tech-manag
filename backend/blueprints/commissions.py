from flask import Blueprint, request, jsonify
from models import db, Commission, CommissionMember, Member
from services.email_service import log_action

commissions_bp = Blueprint('commissions', __name__)

@commissions_bp.route('/api/commissions', methods=['GET'])
def get_commissions():
    commissions = Commission.query.order_by(Commission.id.asc()).all()
    return jsonify([c.to_dict() for c in commissions]), 200

@commissions_bp.route('/api/commissions', methods=['POST'])
def create_commission():
    data = request.json or {}
    name = data.get('name')
    description = data.get('description', '')
    lead_member_id = data.get('lead_member_id')
    operator = data.get('operator', 'Bureau')

    if not name:
        return jsonify({'error': 'Le nom de la commission est requis.'}), 400

    comm = Commission(name=name, description=description, lead_member_id=lead_member_id)
    db.session.add(comm)
    db.session.commit()

    log_action(operator, f"Création de la commission '{name}'")
    return jsonify(comm.to_dict()), 201

@commissions_bp.route('/api/commissions/<int:comm_id>/members', methods=['GET'])
def get_commission_members(comm_id):
    comm = Commission.query.get_or_404(comm_id)
    members_link = CommissionMember.query.filter_by(commission_id=comm.id).all()
    return jsonify([m.to_dict() for m in members_link]), 200

@commissions_bp.route('/api/commissions/<int:comm_id>/members', methods=['POST'])
def add_commission_member(comm_id):
    comm = Commission.query.get_or_404(comm_id)
    data = request.json or {}
    member_id = data.get('member_id')
    operator = data.get('operator', 'Bureau')

    if not member_id:
        return jsonify({'error': 'ID membre requis.'}), 400

    existing = CommissionMember.query.filter_by(commission_id=comm_id, member_id=member_id).first()
    if existing:
        return jsonify({'message': 'Ce membre fait déjà partie de cette commission.'}), 200

    link = CommissionMember(commission_id=comm_id, member_id=member_id)
    db.session.add(link)
    db.session.commit()

    member = Member.query.get(member_id)
    m_name = f"{member.first_name} {member.last_name}" if member else "Membre"
    log_action(operator, f"Ajout de {m_name} à la commission '{comm.name}'")
    return jsonify(link.to_dict()), 201

@commissions_bp.route('/api/commissions/<int:comm_id>/members/<int:member_id>', methods=['DELETE'])
def remove_commission_member(comm_id, member_id):
    comm = Commission.query.get_or_404(comm_id)
    link = CommissionMember.query.filter_by(commission_id=comm_id, member_id=member_id).first_or_404()
    operator = request.args.get('operator', 'Bureau')

    db.session.delete(link)
    db.session.commit()

    log_action(operator, f"Retrait du membre de la commission '{comm.name}'")
    return jsonify({'message': 'Membre retiré'}), 200
