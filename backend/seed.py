from app import app, db
from models import Member, Commission, CommissionMember, OrgChart, InternalDiscussion, ActionLog, CalendarEvent, Attendance
from services.qr_service import generate_qr_code
from werkzeug.security import generate_password_hash

def seed_database():
    with app.app_context():
        db.create_all()

        # 1. Admin Member
        admin = Member.query.filter_by(email="admin@clubtech.org").first()
        if not admin:
            admin = Member(
                member_number="CT-ADMIN",
                pin=generate_password_hash("123456"),
                last_name="Bureau",
                first_name="Admin",
                major="Informatique & Réseaux",
                level="Master 2",
                email="admin@clubtech.org",
                phone="+212 600000000",
                private_notes="Administrateur principal du Bureau CLUB TECH",
                photo_path="uploads/logo.png",
                is_bureau=True,
                must_change_pin=False,
                qr_code_path=generate_qr_code("CT-ADMIN")
            )
            db.session.add(admin)
            db.session.commit()
            print("Admin created.")

        # 2. Regular Members
        m1 = Member.query.filter((Member.email=="youssef.alaoui@clubtech.org") | (Member.member_number=="CT-2026-0001")).first()
        if not m1:
            m1 = Member(
                member_number="CT-2026-0001",
                pin=generate_password_hash("112233"),
                last_name="Alaoui",
                first_name="Youssef",
                major="Génie Logiciel",
                level="Licence 3",
                email="youssef.alaoui@clubtech.org",
                phone="+212 611223344",
                private_notes="Membre très actif, responsable pôle dev web.",
                is_bureau=False,
                must_change_pin=False,
                qr_code_path=generate_qr_code("CT-2026-0001")
            )
            db.session.add(m1)

        m2 = Member.query.filter((Member.email=="sarah.benjelloun@clubtech.org") | (Member.member_number=="CT-2026-0002")).first()
        if not m2:
            m2 = Member(
                member_number="CT-2026-0002",
                pin=generate_password_hash("445566"),
                last_name="Benjelloun",
                first_name="Sarah",
                major="Design & UI/UX",
                level="Master 1",
                email="sarah.benjelloun@clubtech.org",
                phone="+212 655443322",
                private_notes="Lead designer graphique du club.",
                is_bureau=True,
                must_change_pin=False,
                qr_code_path=generate_qr_code("CT-2026-0002")
            )
            db.session.add(m2)

        db.session.commit()

        # 3. Commissions
        c1 = Commission.query.filter_by(name="Pôle Développement Web & Mobile").first()
        if not c1:
            c1 = Commission(
                name="Pôle Développement Web & Mobile",
                description="Conception d'applications web modernes, PWA et applications mobiles.",
                lead_member_id=m1.id if m1 else admin.id
            )
            db.session.add(c1)

        c2 = Commission.query.filter_by(name="Pôle Intelligence Artificielle").first()
        if not c2:
            c2 = Commission(
                name="Pôle Intelligence Artificielle",
                description="Projets de Machine Learning, Computer Vision et NLP.",
                lead_member_id=admin.id
            )
            db.session.add(c2)

        db.session.commit()

        # 4. Events
        ev1 = CalendarEvent.query.filter_by(title="Hackathon C-TECH 2026").first()
        if not ev1:
            from datetime import date
            ev1 = CalendarEvent(
                title="Hackathon C-TECH 2026",
                description="48h pour concevoir une solution tech innovante basée sur l'IA.",
                event_date=date(2026, 11, 15),
                event_time="09:00",
                location="Grand Amphithéâtre Tech",
                category="Hackathon"
            )
            db.session.add(ev1)
            db.session.commit()

        print("Database seeded successfully.")

if __name__ == "__main__":
    seed_database()
