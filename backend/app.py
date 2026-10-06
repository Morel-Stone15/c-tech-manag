import os
import sqlite3

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash

from config import Config
from models import db, Member, OrgChart
from services.email_service import log_action
from services.qr_service import generate_qr_code

# Import blueprints
from blueprints.auth import auth_bp
from blueprints.members import members_bp
from blueprints.attendance import attendance_bp
from blueprints.org_chart import org_chart_bp
from blueprints.commissions import commissions_bp
from blueprints.discussion import discussion_bp
from blueprints.calendar_bp import calendar_bp
from blueprints.admin_bp import admin_bp


def ensure_required_directories(app):
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['PHOTO_FOLDER'], exist_ok=True)
    os.makedirs(app.config['QR_FOLDER'], exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'chat_media'), exist_ok=True)


def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(members_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(org_chart_bp)
    app.register_blueprint(commissions_bp)
    app.register_blueprint(discussion_bp)
    app.register_blueprint(calendar_bp)
    app.register_blueprint(admin_bp)


def register_routes(app):
    @app.route('/')
    def index():
        return jsonify({
            'status': 'online',
            'app': 'Club Tech API Server',
            'version': '2.0.0',
            'message': 'Le serveur Backend Flask fonctionne parfaitement. Accédez au Frontend sur http://localhost:3000'
        }), 200

    @app.route('/uploads/<path:filename>')
    @app.route('/api/uploads/<path:filename>')
    def serve_uploads(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


def run_migrations(app):
    db_path = os.path.join(app.config['BASE_DIR'], 'clubtech.db')
    if not os.path.exists(db_path):
        return

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()

        cursor.execute("PRAGMA table_info(members)")
        member_columns = [row[1] for row in cursor.fetchall()]
        if member_columns:
            if 'must_change_pin' not in member_columns:
                cursor.execute("ALTER TABLE members ADD COLUMN must_change_pin BOOLEAN DEFAULT 1")
            if 'pin_expires_at' not in member_columns:
                cursor.execute("ALTER TABLE members ADD COLUMN pin_expires_at DATETIME")

        cursor.execute("PRAGMA table_info(internal_discussion)")
        discussion_columns = [row[1] for row in cursor.fetchall()]
        if discussion_columns:
            if 'attachment_path' not in discussion_columns:
                cursor.execute("ALTER TABLE internal_discussion ADD COLUMN attachment_path VARCHAR(500)")
            if 'attachment_type' not in discussion_columns:
                cursor.execute("ALTER TABLE internal_discussion ADD COLUMN attachment_type VARCHAR(20)")
            if 'attachment_name' not in discussion_columns:
                cursor.execute("ALTER TABLE internal_discussion ADD COLUMN attachment_name VARCHAR(255)")
            if 'receiver_id' not in discussion_columns:
                cursor.execute("ALTER TABLE internal_discussion ADD COLUMN receiver_id INTEGER")
            if 'group_id' not in discussion_columns:
                cursor.execute("ALTER TABLE internal_discussion ADD COLUMN group_id INTEGER")

        conn.commit()


def seed_default_admin(app):
    existing_admin = Member.query.filter_by(member_number="CT-ADMIN").first()
    if existing_admin is None:
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

        log_action("Système", "Initialisation de la base de données et création du compte Admin Bureau.")
        return

    if not existing_admin.is_bureau or existing_admin.must_change_pin:
        existing_admin.is_bureau = True
        existing_admin.must_change_pin = False
        db.session.commit()
        log_action("Système", "Mise à jour du compte CT-ADMIN (Bureau=True, must_change_pin=False).")


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    ensure_required_directories(app)
    db.init_app(app)
    register_blueprints(app)
    register_routes(app)

    with app.app_context():
        run_migrations(app)
        db.create_all()
        seed_default_admin(app)

    return app


app = create_app()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=app.config.get('DEBUG', True))
