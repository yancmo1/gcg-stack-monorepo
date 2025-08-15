# app_pg.py
import os
from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
from db import SessionLocal, engine
from sqlalchemy import text
from models_pg import Learner
import csv
from datetime import datetime
DATA_DIR = os.getenv('DATA_DIR', '/data')
SEED_ON_START = os.getenv('SEED_ON_START', 'true').lower() in ('1','true','yes')

app = Flask(__name__)
CORS(app)

# Ensure tables exist
from db import Base
Base.metadata.create_all(bind=engine)

def _parse_date(val: str):
    if not val:
        return None
    for fmt in ('%Y-%m-%d','%m/%d/%Y','%m/%d/%y'):
        try:
            return datetime.strptime(val.strip(), fmt).date()
        except Exception:
            continue
    return None

def seed_from_csv():
    """Idempotent CSV import. Only inserts learners that do not already exist (matched by employee_name)."""
    tracker_path = os.path.join(DATA_DIR, 'Training LMS Tracker(Tracker) (1).csv')
    if not os.path.isfile(tracker_path):
        return 0
    inserted = 0
    db = SessionLocal()
    try:
        existing_names = {n for (n,) in db.query(Learner.employee_name).all()}
        with open(tracker_path, newline='') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = (row.get('Employee Name') or row.get('employee_name') or '').strip()
                if not name or name in existing_names:
                    continue
                learner = Learner(
                    employee_name=name,
                    title=(row.get('Title') or row.get('title') or '').strip(),
                    region=(row.get('Region') or row.get('region') or '').strip(),
                    start_date=_parse_date(row.get('Start Date') or row.get('start_date') or ''),
                    completion_date=_parse_date(row.get('Completion Date') or row.get('completion_date') or ''),
                    status=(row.get('Status') or row.get('status') or 'In Progress').strip() or 'In Progress',
                    sort_order=None,
                    notes=(row.get('Notes') or row.get('notes') or '').strip(),
                    trainer=(row.get('Trainer') or row.get('trainer') or '').strip(),
                    mtl_completed=(row.get('MTL Completed') or row.get('MTL') or row.get('mtl_completed') or '').strip(),
                    new_hire_test_score=(lambda v: (float(v) if v and v.strip() else None))(row.get('New Hire Test Score')),
                    group='Learner'
                )
                db.add(learner)
                inserted += 1
        if inserted:
            db.commit()
        else:
            db.rollback()
        return inserted
    except Exception:
        db.rollback()
        return 0
    finally:
        db.close()

# Seed if enabled and table empty
if SEED_ON_START:
    with SessionLocal() as _s:
        count = _s.query(Learner).count()
    if count == 0:
        inserted = seed_from_csv()
        app.logger.info(f"Seeded learners: {inserted}")

# Config
PORT = int(os.getenv('PORT', '6001'))
ENV = os.getenv('FLASK_ENV', 'development')

api = Blueprint('api', __name__, url_prefix='/api')

# Health endpoint
@app.get('/health')
def health():
    try:
        db = SessionLocal()
        from sqlalchemy import text
        db.execute(text('SELECT 1'))
        db.close()
        return jsonify({
            'status': 'ok',
            'env': ENV,
            'db': 'postgres'
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Error handlers
@app.errorhandler(400)
def handle_400(e):
    return jsonify({'error': 'Bad Request', 'message': str(e)}), 400

@app.errorhandler(404)
def handle_404(e):
    return jsonify({'error': 'Not Found'}), 404

@app.errorhandler(500)
def handle_500(e):
    return jsonify({'error': 'Internal Server Error'}), 500

# Learners endpoints
@api.route('/learners', methods=['GET'])
def get_learners():
    db = SessionLocal()
    try:
        learners = db.query(Learner).order_by(Learner.id.desc()).all()
        result = []
        for learner in learners:
            result.append({
                'id': learner.id,
                'employee_name': learner.employee_name,
                'title': learner.title,
                'region': learner.region,
                'start_date': learner.start_date.isoformat() if learner.start_date is not None else None,
                'completion_date': learner.completion_date.isoformat() if learner.completion_date is not None else None,
                'status': learner.status,
                'sort_order': learner.sort_order,
                'notes': learner.notes,
                'trainer': learner.trainer,
                'mtl_completed': learner.mtl_completed,
                'new_hire_test_score': learner.new_hire_test_score,
                'group': learner.group
            })
        return jsonify(result)
    finally:
        db.close()

@api.route('/learners', methods=['POST'])
def add_learner():
    data = request.json
    if not data:
        return jsonify({'error': 'Missing or invalid JSON body'}), 400
    
    db = SessionLocal()
    try:
        # Parse dates
        start_date = None
        completion_date = None
        if data.get('start_date'):
            try:
                start_date = datetime.fromisoformat(data['start_date']).date()
            except:
                pass
        if data.get('completion_date'):
            try:
                completion_date = datetime.fromisoformat(data['completion_date']).date()
            except:
                pass
        
        learner = Learner(
            employee_name=data.get('employee_name', ''),
            title=data.get('title', ''),
            region=data.get('region', ''),
            start_date=start_date,
            completion_date=completion_date,
            status=data.get('status', 'In Progress'),
            sort_order=data.get('sort_order'),
            notes=data.get('notes', ''),
            trainer=data.get('trainer', ''),
            mtl_completed=data.get('mtl_completed', ''),
            new_hire_test_score=data.get('new_hire_test_score'),
            group=data.get('group', 'Learner')
        )
        db.add(learner)
        db.commit()
        db.refresh(learner)
        return jsonify({'message': 'Learner added', 'id': learner.id}), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@api.route('/learners/<int:learner_id>', methods=['PUT'])
def update_learner(learner_id):
    data = request.json
    if not data:
        return jsonify({'error': 'Missing or invalid JSON body'}), 400
    
    db = SessionLocal()
    try:
        learner = db.query(Learner).filter(Learner.id == learner_id).first()
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404
        
        # Update fields
        if 'employee_name' in data:
            learner.employee_name = data['employee_name']
        if 'title' in data:
            learner.title = data['title']
        if 'region' in data:
            learner.region = data['region']
        if 'start_date' in data:
            try:
                learner.start_date = datetime.fromisoformat(data['start_date']).date() if data['start_date'] else None  # type: ignore
            except:
                pass
        if 'completion_date' in data:
            try:
                learner.completion_date = datetime.fromisoformat(data['completion_date']).date() if data['completion_date'] else None  # type: ignore
            except:
                pass
        if 'status' in data:
            learner.status = data['status']
        if 'sort_order' in data:
            learner.sort_order = data['sort_order']
        if 'notes' in data:
            learner.notes = data['notes']
        if 'trainer' in data:
            learner.trainer = data['trainer']
        if 'mtl_completed' in data:
            learner.mtl_completed = data['mtl_completed']
        if 'new_hire_test_score' in data:
            learner.new_hire_test_score = data['new_hire_test_score']
        if 'group' in data:
            learner.group = data['group']
        
        db.commit()
        return jsonify({'message': 'Learner updated successfully'}), 200
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@api.route('/learners/<int:learner_id>', methods=['DELETE'])
def delete_learner(learner_id):
    db = SessionLocal()
    try:
        learner = db.query(Learner).filter(Learner.id == learner_id).first()
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404
        
        db.delete(learner)
        db.commit()
        return jsonify({'message': 'Learner deleted successfully'}), 200
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

# Legacy records endpoints (keeping for backward compatibility)
@api.route('/records', methods=['GET'])
def get_records():
    # Redirect to learners for now
    return get_learners()

# Dashboard Metrics (updated for learners)
@api.route('/metrics/summary')
def metrics_summary():
    db = SessionLocal()
    try:
        total = db.query(Learner).count()
        completed = db.query(Learner).filter(Learner.status == 'Completed').count()
        inprogress = db.query(Learner).filter(Learner.status == 'In Progress').count()
        # Overdue: not completed, start_date older than 30 days ago
        from sqlalchemy import and_, func, text
        overdue = db.query(Learner).filter(
            and_(
                Learner.status != 'Completed',
                Learner.start_date.isnot(None),
                Learner.start_date < func.current_date() - text("interval '30 days'")
            )
        ).count()
        
        return jsonify({
            'totalRecords': total,
            'completed': completed,
            'inProgress': inprogress,
            'overdue': overdue
        })
    finally:
        db.close()

@api.route('/metrics/tests')
def metrics_tests():
    # For now, return empty data since we don't have tests in learners table
    return jsonify({
        'last30Days': {'Initial': 0, 'Retest': 0},
        'passRateLast30': 0,
        'recent': []
    })

# Register blueprint
app.register_blueprint(api)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=(ENV == 'development'))
