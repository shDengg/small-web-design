from flask import Blueprint, jsonify, request
from ..models import MedicationRecord
from ..extensions import db

medication_bp = Blueprint("medication", __name__)


@medication_bp.route("/children/<int:child_id>/medication", methods=["GET"])
def get_medication_records(child_id):
    records = MedicationRecord.query.filter_by(child_id=child_id).all()
    results = [{
        "id": r.id,
        "child_id": r.child_id,
        "medication_date": r.medication_date,
        "medication_time": r.medication_time,
        "medication_type": r.medication_type,
        "dosage": r.dosage
    } for r in records]
    return jsonify({"status": "success", "results": results})


@medication_bp.route("/children/<int:child_id>/medication", methods=["POST"])
def add_medication_record(child_id):
    data = request.json
    required_fields = ["medication_date", "medication_time", "medication_type", "dosage"]
    if not all(key in data for key in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    record = MedicationRecord(
        child_id=child_id,
        medication_date=data.get("medication_date"),
        medication_time=data.get("medication_time"),
        medication_type=data.get("medication_type"),
        dosage=data.get("dosage")
    )
    db.session.add(record)
    db.session.commit()
    return jsonify({
        "status": "success",
        "message": "Medication record added",
        "id": record.id
    }), 201


@medication_bp.route("/children/<int:child_id>/medication/<int:record_id>", methods=["DELETE"])
def delete_medication_record(child_id, record_id):
    record = MedicationRecord.query.filter_by(id=record_id, child_id=child_id).first_or_404()
    db.session.delete(record)
    db.session.commit()
    return jsonify({"status": "success", "message": "Medication record deleted"})