# database.py
from app import create_app
from models import db, User
from werkzeug.security import generate_password_hash
from sqlalchemy import text # Import text to run raw SQL

app = create_app()

def init_db():
    with app.app_context():
        # NFR4: System ensures data storage (Creates tables)
        db.create_all()
        
        # --- NEW: MIGRATION LOGIC ---
        # This tries to add the column. If it fails (because it exists), it continues safely.
        try:
            with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE user ADD COLUMN student_number VARCHAR(20)"))
                conn.commit()
                print("SUCCESS: 'student_number' column added to User table.")
        except Exception as e:
            # If the column already exists, this error is expected and ignored
            print("Note: 'student_number' column already exists or could not be added.")
        # -----------------------------

        # Create a default Admin if one doesn't exist (For testing)
        if not User.query.filter_by(role='admin').first():
            hashed_pw = generate_password_hash('admin123', method='pbkdf2:sha256')
            admin = User(
                email='admin@ccis.edu.ph',
                password=hashed_pw,
                first_name='System',
                last_name='Admin',
                role='admin'
            )
            db.session.add(admin)
            db.session.commit()
            print("Database initialized and Default Admin created.")
        else:
            print("Database check complete.")

if __name__ == "__main__":
    init_db()