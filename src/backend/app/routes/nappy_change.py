from flask import Blueprint, jsonify, request
from ..models import NappyChangeRecord
from ..extensions import db

nappy_bp = Blueprint("nappy", __name__)

@nappy_bp.route("/children/<int:child_id>/nappy", methods=["GET"])
def get_nappy_records(child_id):
    records = NappyChangeRecord.query.filter_by(child_id=child_id).all()
    results = [{
        "id": r.id,
        "child_id": r.child_id,
        "change_date": r.change_date,
        "change_time": r.change_time,
        "change_type": r.change_type
    } for r in records]
    return jsonify({"status": "success", "results": results})


@nappy_bp.route("/children/<int:child_id>/nappy", methods=["POST"])
def add_nappy_record(child_id):
    data = request.json
    required_fields = ["change_date", "change_time", "change_type"]
    if not all(key in data for key in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    record = NappyChangeRecord(
        child_id=child_id,
        change_date=data.get("change_date"),
        change_time=data.get("change_time"),
        change_type=data.get("change_type")
    )
    db.session.add(record)
    db.session.commit()
    return jsonify({
        "status": "success",
        "message": "Nappy record added",
        "id": record.id
    }), 201


@nappy_bp.route("/children/<int:child_id>/nappy/<int:record_id>", methods=["DELETE"])
def delete_nappy_record(child_id, record_id):
    record = NappyChangeRecord.query.filter_by(id=record_id, child_id=child_id).first_or_404()
    db.session.delete(record)
    db.session.commit()
    return jsonify({"status": "success", "message": "Nappy record deleted"})