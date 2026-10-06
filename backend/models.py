from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Member(db.Model):
    __tablename__ = 'members'

    id = db.Column(db.Integer, primary_key=True)
    member_number = db.Column(db.String(20), unique=True, nullable=False)
    pin = db.Column(db.String(255), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    major = db.Column(db.String(100), nullable=False)
    level = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    phone = db.Column(db.String(30), nullable=False)
    photo_path = db.Column(db.String(255), nullable=True)
    qr_code_path = db.Column(db.String(255), nullable=True)
    private_notes = db.Column(db.Text, default='')
    status = db.Column(db.String(20), default='actif')
    is_bureau = db.Column(db.Boolean, default=False)
    must_change_pin = db.Column(db.Boolean, default=True)
    pin_expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'member_number': self.member_number,
            'last_name': self.last_name,
            'first_name': self.first_name,
            'major': self.major,
            'level': self.level,
            'email': self.email,
            'phone': self.phone,
            'photo_path': self.photo_path,
            'qr_code_path': self.qr_code_path,
            'private_notes': self.private_notes,
            'status': self.status,
            'is_bureau': self.is_bureau,
            'must_change_pin': self.must_change_pin,
            'pin_expires_at': self.pin_expires_at.isoformat() if self.pin_expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class OrgChart(db.Model):
    __tablename__ = 'org_chart'

    id = db.Column(db.Integer, primary_key=True)
    role_name = db.Column(db.String(100), nullable=False)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id', ondelete='SET NULL'), nullable=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('org_chart.id', ondelete='CASCADE'), nullable=True)
    order = db.Column(db.Integer, default=0)

    member = db.relationship('Member', backref='org_roles', lazy=True)
    children = db.relationship('OrgChart', backref=db.backref('parent', remote_side=[id]), lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'role_name': self.role_name,
            'member_id': self.member_id,
            'parent_id': self.parent_id,
            'order': self.order,
            'member': self.member.to_dict() if self.member else None
        }


class Commission(db.Model):
    __tablename__ = 'commissions'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    lead_member_id = db.Column(db.Integer, db.ForeignKey('members.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    lead_member = db.relationship('Member', backref='led_commissions', lazy=True)
    members = db.relationship('CommissionMember', backref='commission', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'lead_member_id': self.lead_member_id,
            'lead_member': self.lead_member.to_dict() if self.lead_member else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'member_count': len(self.members)
        }


class CommissionMember(db.Model):
    __tablename__ = 'commission_members'

    id = db.Column(db.Integer, primary_key=True)
    commission_id = db.Column(db.Integer, db.ForeignKey('commissions.id', ondelete='CASCADE'), nullable=False)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id', ondelete='CASCADE'), nullable=False)

    member = db.relationship('Member', backref='commissions_joined', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'commission_id': self.commission_id,
            'member_id': self.member_id,
            'member': self.member.to_dict() if self.member else None
        }


class InternalDiscussion(db.Model):
    __tablename__ = 'internal_discussion'

    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id', ondelete='CASCADE'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('members.id', ondelete='CASCADE'), nullable=True)
    group_id = db.Column(db.Integer, db.ForeignKey('chat_groups.id', ondelete='CASCADE'), nullable=True)
    message = db.Column(db.Text, nullable=True)
    attachment_path = db.Column(db.String(500), nullable=True)
    attachment_type = db.Column(db.String(20), nullable=True)
    attachment_name = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    member = db.relationship('Member', foreign_keys=[member_id], backref='sent_discussions', lazy=True)
    receiver = db.relationship('Member', foreign_keys=[receiver_id], backref='received_discussions', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'member_id': self.member_id,
            'receiver_id': self.receiver_id,
            'group_id': self.group_id,
            'message': self.message,
            'attachment_path': self.attachment_path,
            'attachment_type': self.attachment_type,
            'attachment_name': self.attachment_name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'sender_name': f"{self.member.first_name} {self.member.last_name}" if self.member else "Anonyme",
            'sender_photo': self.member.photo_path if self.member else None,
            'is_bureau': self.member.is_bureau if self.member else False
        }


class ChatGroup(db.Model):
    __tablename__ = 'chat_groups'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_by_id = db.Column(db.Integer, db.ForeignKey('members.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    created_by = db.relationship('Member', lazy=True)
    members_link = db.relationship('ChatGroupMember', backref='group', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_by_id': self.created_by_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'member_ids': [m.member_id for m in self.members_link]
        }


class ChatGroupMember(db.Model):
    __tablename__ = 'chat_group_members'

    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('chat_groups.id', ondelete='CASCADE'), nullable=False)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id', ondelete='CASCADE'), nullable=False)

    member = db.relationship('Member', lazy=True)


class UserStatus(db.Model):
    __tablename__ = 'user_statuses'

    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id', ondelete='CASCADE'), nullable=False)
    content = db.Column(db.Text, nullable=True)
    media_path = db.Column(db.String(500), nullable=True)
    media_type = db.Column(db.String(20), default='text')
    bg_color = db.Column(db.String(30), default='#6366f1')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    member = db.relationship('Member', backref='statuses', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'member_id': self.member_id,
            'content': self.content,
            'media_path': self.media_path,
            'media_type': self.media_type,
            'bg_color': self.bg_color,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'member_name': f"{self.member.first_name} {self.member.last_name}" if self.member else "Membre",
            'member_photo': self.member.photo_path if self.member else None,
            'is_bureau': self.member.is_bureau if self.member else False
        }


class ActionLog(db.Model):
    __tablename__ = 'action_logs'

    id = db.Column(db.Integer, primary_key=True)
    operator_name = db.Column(db.String(100), nullable=False)
    action_description = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'operator_name': self.operator_name,
            'action_description': self.action_description,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }


class CalendarEvent(db.Model):
    __tablename__ = 'calendar_events'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    event_date = db.Column(db.Date, nullable=False)
    event_time = db.Column(db.String(10), nullable=True)
    location = db.Column(db.String(150), nullable=True)
    category = db.Column(db.String(50), default='general')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    attendances = db.relationship('Attendance', backref='event', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'event_date': self.event_date.isoformat() if self.event_date else None,
            'event_time': self.event_time,
            'location': self.location,
            'category': self.category,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'participant_count': len(self.attendances)
        }


class Attendance(db.Model):
    __tablename__ = 'attendance'

    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id', ondelete='CASCADE'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('calendar_events.id', ondelete='SET NULL'), nullable=True)
    event_name = db.Column(db.String(150), nullable=False)
    scanned_at = db.Column(db.DateTime, default=datetime.utcnow)

    member = db.relationship('Member', backref='attendances', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'member_id': self.member_id,
            'event_id': self.event_id,
            'event_name': self.event_name,
            'scanned_at': self.scanned_at.isoformat() if self.scanned_at else None,
            'member_name': f"{self.member.first_name} {self.member.last_name}" if self.member else "Membre",
            'member_number': self.member.member_number if self.member else ""
        }
