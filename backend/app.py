from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Database Configuration
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://user:password@db:5432/student_rotations"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# Student Model
class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    role = db.Column(db.String(50), nullable=False)  # Example: Excavator, Recorder

class Schedule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("student.id"), nullable=False)
    date = db.Column(db.String(20), nullable=False)
    shift = db.Column(db.String(50), nullable=False)


# Ensure database tables exist
with app.app_context():
    db.create_all()

# Add the missing `/students` route
@app.route("/students", methods=["GET"])
def get_students():
    students = Student.query.all()
    return jsonify([{ "id": s.id, "name": s.name, "email": s.email, "role": s.role} for s in students])

@app.route("/students", methods=["POST"])
def add_student():
    data = request.json
    new_student = Student(name=data["name"], email=data["email"], role=data["role"])
    db.session.add(new_student)
    db.session.commit()
    return jsonify({"message": "Student added successfully"}), 201


# Fetch all schedules
@app.route("/schedule", methods=["GET"])
def get_schedule():
    schedules = db.session.query(
        Schedule.id, Schedule.date, Schedule.shift, Student.name
    ).join(Student, Schedule.student_id == Student.id).all()
    
    return jsonify([
        {"id": s.id, "student_name": s.name, "date": s.date, "shift": s.shift}
        for s in schedules
    ])


# Add a new schedule entry
@app.route("/schedule", methods=["POST"])
def add_schedule():
    data = request.json
    new_schedule = Schedule(student_id=data["student_id"], date=data["date"], shift=data["shift"])
    db.session.add(new_schedule)
    db.session.commit()

    # If a shift is assigned, also add it to the schedule
    if data.get("shift"):
        new_schedule = Schedule(student_id=new_student.id, student_name=new_student.name, shift=data["shift"])
        db.session.add(new_schedule)
        db.session.commit()
        
    return jsonify({"message": "Schedule added successfully"}), 201

@app.route("/students/<int:student_id>/assign_shift", methods=["PATCH"])
def assign_shift(student_id):
    data = request.json
    student = Student.query.get(student_id)
    
    if not student:
        return jsonify({"message": "Student not found"}), 404

    if "shift" in data:
        student.shift = data["shift"]
        db.session.commit()
        return jsonify({"message": "Shift assigned successfully"}), 200

    return jsonify({"message": "No shift provided"}), 400


@app.route("/students/<int:id>", methods=["DELETE"])
def delete_student(id):
    student = Student.query.get(id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    db.session.delete(student)
    db.session.commit()
    return jsonify({"message": "Student deleted successfully"}), 200


# Default Route
@app.route("/")
def home():
    return jsonify({"message": "Flask app is running!"})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)  
