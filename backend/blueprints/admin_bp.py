import os
from flask import Blueprint, request, jsonify, send_file, current_app
from werkzeug.security import generate_password_hash
from models import db, Member, OrgChart, ActionLog
from services.qr_service import generate_qr_code
from services.excel_service import generate_members_excel, import_members_from_excel
from services.email_service import log_action

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/api/reset_database', methods=['POST'])
def reset_database():
    """Purge all data from the database except default Admin."""
    try:
        db.drop_all()
        db.create_all()

        admin_member = Member(
            member_number="CT-ADMIN",
            pin=generate_password_hash("123456"),
            last_name="Bureau",
            first_name="Admin",
            major="Informatique",
            level="Bureau",
            email="admin@clubtech.org",
            phone="0000000000",
            photo_path="uploads/logo.png",
            is_bureau=True,
            must_change_pin=False
        )
        db.session.add(admin_member)
        db.session.commit()
        
        admin_member.qr_code_path = generate_qr_code("CT-ADMIN")
        db.session.commit()
        
        ceo_role = OrgChart(role_name="Président", member_id=admin_member.id, parent_id=None, order=1)
        db.session.add(ceo_role)
        db.session.commit()

        log_action("Système", "Purger et réinitialisation complète de la base de données.")
        return jsonify({'message': 'Base de données réinitialisée avec succès !'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur lors de la réinitialisation: {str(e)}'}), 500

@admin_bp.route('/api/backup', methods=['GET'])
def download_backup():
    db_path = os.path.join(current_app.config['BASE_DIR'], 'clubtech.db')
    if os.path.exists(db_path):
        log_action("Bureau / Sauvegarde", "Téléchargement de la base de données complète.")
        return send_file(db_path, as_attachment=True, download_name="clubtech_backup.db")
    return jsonify({'error': 'Fichier de base de données introuvable.'}), 404

@admin_bp.route('/api/export_excel', methods=['GET'])
def export_excel():
    output = generate_members_excel()
    log_action("Bureau / Export", "Exportation de la liste des membres au format Excel.")
    return send_file(
        output,
        as_attachment=True,
        download_name="Membres_C-TECH.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@admin_bp.route('/api/import_excel', methods=['POST'])
def import_excel():
    file = request.files.get('file')
    operator = request.form.get('operator', 'Bureau')
    if not file:
        return jsonify({'error': 'Aucun fichier fourni.'}), 400
        
    try:
        imported_count, errors = import_members_from_excel(file, operator=operator)
        return jsonify({
            'message': f'{imported_count} membres importés avec succès.',
            'errors': errors
        }), 200
    except Exception as e:
        return jsonify({'error': f"Erreur lors de l'analyse du fichier Excel: {str(e)}"}), 500

@admin_bp.route('/api/logs', methods=['GET'])
def get_logs():
    logs = ActionLog.query.order_by(ActionLog.timestamp.desc()).limit(100).all()
    return jsonify([l.to_dict() for l in logs]), 200
