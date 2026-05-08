from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

# Satisfies 5.2 Entity-Relationship Diagram: User Entity
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    student_number = db.Column(db.String(20), unique=True, nullable=True)
    password = db.Column(db.String(150), nullable=False)
    first_name = db.Column(db.String(150), nullable=False)
    last_name = db.Column(db.String(150), nullable=False)
    role = db.Column(db.String(20), default='student') # 'student' or 'admin'
    
    # Relationship: A Student can submit many complaints [cite: 63]
    complaints = db.relationship('Complaint', backref='author', lazy=True)

# Satisfies 5.2 Entity-Relationship Diagram: Complaint Entity
class Complaint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # FR2: Required fields for complaint submission
    title = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False) # Academic, Facilities, etc.
    description = db.Column(db.Text, nullable=False)
    
    # FR6: Specific status stages (Submitted, In Review, In Progress, Resolved)
    status = db.Column(db.String(20), default='Submitted', nullable=False)
    
    # FR7: Admin remarks/actions taken
    admin_remarks = db.Column(db.Text, nullable=True)
    
    date_posted = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # ADD THIS LINE:
    evidence_file = db.Column(db.String(255), nullable=True)
    
    # Foreign Key linking to User
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)