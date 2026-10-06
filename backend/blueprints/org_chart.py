from flask import Blueprint, request, jsonify
from models import db, OrgChart
from services.email_service import log_action

org_chart_bp = Blueprint('org_chart', __name__)

@org_chart_bp.route('/api/org_chart', methods=['GET'])
def get_org_chart():
    roles = OrgChart.query.order_by(OrgChart.order.asc()).all()
    return jsonify([r.to_dict() for r in roles]), 200

@org_chart_bp.route('/api/org_chart', methods=['POST'])
def add_org_role():
    data = request.json or {}
    role_name = data.get('role_name')
    member_id = data.get('member_id')
    parent_id = data.get('parent_id')
    order = data.get('order', 0)
    operator = data.get('operator', 'Bureau')

    if not role_name:
        return jsonify({'error': 'Le nom du poste est requis.'}), 400

    role = OrgChart(role_name=role_name, member_id=member_id, parent_id=parent_id, order=order)
    db.session.add(role)
    db.session.commit()

    log_action(operator, f"Ajout du poste '{role_name}' dans l'organigramme.")
    return jsonify(role.to_dict()), 201

@org_chart_bp.route('/api/org_chart/<int:role_id>', methods=['PUT'])
def update_org_role(role_id):
    role = OrgChart.query.get_or_404(role_id)
    data = request.json or {}
    operator = data.get('operator', 'Bureau')

    if 'role_name' in data:
        role.role_name = data['role_name']
    if 'member_id' in data:
        role.member_id = data['member_id']
    if 'parent_id' in data:
        role.parent_id = data['parent_id']
    if 'order' in data:
        role.order = data['order']

    db.session.commit()
    log_action(operator, f"Mise à jour du poste '{role.role_name}' dans l'organigramme.")
    return jsonify(role.to_dict()), 200

@org_chart_bp.route('/api/org_chart/<int:role_id>', methods=['DELETE'])
def delete_org_role(role_id):
    role = OrgChart.query.get_or_404(role_id)
    operator = request.args.get('operator', 'Bureau')
    name = role.role_name

    db.session.delete(role)
    db.session.commit()

    log_action(operator, f"Suppression du poste '{name}' de l'organigramme.")
    return jsonify({'message': 'Poste supprimé'}), 200
