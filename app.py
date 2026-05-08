import os
from flask import Flask, render_template, request, flash, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from models import db, User, Complaint
from flask import jsonify
from werkzeug.utils import secure_filename

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'ccis-secret-key-2025'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ccis_cms.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    login_manager = LoginManager()
    login_manager.login_view = 'login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(id):
        return User.query.get(int(id))
    
    UPLOAD_FOLDER = 'static/uploads'
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

    # --- ROUTES ---

    @app.route('/')
    def index():
        if current_user.is_authenticated:
            if current_user.role == 'admin':
                return redirect(url_for('admin_dashboard'))
            return redirect(url_for('student_dashboard'))
        return redirect(url_for('login'))

    @app.route('/register', methods=['GET', 'POST'])
    def register():
        if request.method == 'POST':
            email = request.form.get('email')
            student_number = request.form.get('student_number') 
            password = request.form.get('password')
            first_name = request.form.get('firstName')
            last_name = request.form.get('lastName')

            user = User.query.filter_by(email=email).first()
            if user:
                flash('Email already exists.', 'error')
            else:
                new_user = User(
                    email=email,
                    student_number=student_number,
                    first_name=first_name,
                    last_name=last_name,
                    password=generate_password_hash(password, method='pbkdf2:sha256'),
                    role='student' 
                )
                db.session.add(new_user)
                db.session.commit()
                flash('Account created! Please log in.', 'success')
                return redirect(url_for('login'))
        return render_template('register.html')

    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if request.method == 'POST':
            email = request.form.get('email')
            password = request.form.get('password')
            user = User.query.filter_by(email=email).first()

            if user and check_password_hash(user.password, password):
                login_user(user)
                if user.role == 'admin':
                    return redirect(url_for('admin_dashboard'))
                return redirect(url_for('student_dashboard'))
            else:
                flash('Invalid email or password.', 'error')
        return render_template('login.html')

    @app.route('/logout')
    @login_required
    def logout():
        logout_user()
        return redirect(url_for('login'))

    @app.route('/submit', methods=['GET', 'POST'])
    @login_required
    def submit_complaint():
        if current_user.role == 'admin':
            return redirect(url_for('admin_dashboard')) # Restriction
        
        if request.method == 'POST':
            title = request.form.get('title')
            category = request.form.get('category')
            description = request.form.get('description')

            new_complaint = Complaint(
                title=title,
                category=category,
                description=description,
                user_id=current_user.id
            )
            db.session.add(new_complaint)
            db.session.commit()
            flash('Complaint submitted successfully.', 'success')
            return redirect(url_for('student_dashboard'))
        
        return render_template('submit_complaint.html')

    @app.route('/student/dashboard')
    @login_required
    def student_dashboard():
        if current_user.role == 'admin':
            return redirect(url_for('admin_dashboard'))
        
        # Filter query by current_user.id to ensure confidentiality
        my_complaints = Complaint.query.filter_by(user_id=current_user.id).order_by(Complaint.date_posted.desc()).all()
        return render_template('dashboard.html', complaints=my_complaints)

    @app.route('/admin/dashboard', methods=['GET', 'POST'])
    @login_required
    def admin_dashboard():
        if current_user.role != 'admin':
            flash('Unauthorized access.', 'error')
            return redirect(url_for('student_dashboard'))
        
        all_complaints = Complaint.query.order_by(Complaint.date_posted.desc()).all()
        
        chart_data = {
            'Academic': Complaint.query.filter_by(category='Academic').count(),
            'Facilities': Complaint.query.filter_by(category='Facilities').count(),
            'Administration': Complaint.query.filter_by(category='Administration').count(),
            'Other': Complaint.query.filter_by(category='Other').count()
        }
        
        return render_template('admin_dashboard.html', complaints=all_complaints, chart_data=chart_data)

    @app.route('/admin/update/<int:id>', methods=['POST'])
    @login_required
    def update_complaint(id):
        if current_user.role != 'admin':
            return redirect(url_for('student_dashboard'))
        
        complaint = Complaint.query.get_or_404(id)
        complaint.status = request.form.get('status')
        complaint.admin_remarks = request.form.get('remarks')
        
        db.session.commit()
        flash(f'Complaint #{id} updated successfully.', 'success')
        return redirect(url_for('admin_dashboard'))
    
    @app.route('/api/student/data')
    @login_required
    def get_dashboard_data():
        complaints = Complaint.query.filter_by(user_id=current_user.id).order_by(Complaint.date_posted.desc()).all()
        total = len(complaints)
        pending = sum(1 for c in complaints if c.status in ['Submitted', 'In Review', 'In Progress'])
        resolved = sum(1 for c in complaints if c.status == 'Resolved')
        
        # Serialize data for JavaScript
        complaints_list = [{
            'id': c.id,
            'title': c.title,
            'category': c.category,
            'date': c.date_posted.strftime('%b %d, %Y'), # Format: Dec 08, 2025
            'status': c.status,
            'remarks': c.admin_remarks if c.admin_remarks else "No remarks yet",
            'has_file': True if c.evidence_file else False
        } for c in complaints]
        
        return jsonify({
            'stats': {'total': total, 'pending': pending, 'resolved': resolved},
            'complaints': complaints_list
        })

    # API: Submit Complaint via AJAX
    @app.route('/api/student/submit', methods=['POST'])
    @login_required
    def submit_complaint_ajax():
        try:
            title = request.form.get('title')
            category = request.form.get('category')
            description = request.form.get('description')
            file = request.files.get('file')

            filename = None
            if file:
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

            # Create new record in Database
            new_complaint = Complaint(
                title=title,
                category=category,
                description=description,
                evidence_file=filename,
                user_id=current_user.id,
                status='Submitted' # Default status
            )
            
            db.session.add(new_complaint)
            db.session.commit()
            
            return jsonify({'success': True, 'message': 'Complaint logged successfully!'})
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)})

    # API: Delete Complaint (Optional Feature)
    @app.route('/api/student/delete/<int:id>', methods=['DELETE'])
    @login_required
    def delete_complaint_ajax(id):
        complaint = Complaint.query.get_or_404(id)
        if complaint.user_id != current_user.id:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
            
        db.session.delete(complaint)
        db.session.commit()
        return jsonify({'success': True})
    
    @app.route('/admin/delete/<int:id>', methods=['POST'])
    @login_required
    def delete_complaint_admin(id):
        if current_user.role != 'admin':
            flash('Unauthorized action.', 'error')
            return redirect(url_for('admin_dashboard'))
            
        complaint = Complaint.query.get_or_404(id)
        
        # Optional: Delete the evidence file from the server if it exists
        if complaint.evidence_file:
            try:
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], complaint.evidence_file)
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"Error deleting file: {e}")

        db.session.delete(complaint)
        db.session.commit()
        flash(f'Complaint #{id} has been permanently deleted.', 'success')
        return redirect(url_for('admin_dashboard'))

    return app

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)