from flask import Blueprint, jsonify, request
from ..models import TemperatureRecord
from ..extensions import db

temperature_bp = Blueprint("temperature", __name__)


@temperature_bp.route("/children/<int:child_id>/temperature", methods=["GET"])
def get_temperature_records(child_id):
    records = TemperatureRecord.query.filter_by(child_id=child_id).all()
    results = [{
        "id": r.id,
        "child_id": r.child_id,
        "date": r.date,
        "temperature": r.temperature,
        "temperature_time": r.temperature_time
    } for r in records]
    return jsonify({"status": "success", "results": results})


@temperature_bp.route("/children/<int:child_id>/temperature", methods=["POST"])
def add_temperature_record(child_id):
    data = request.json
    required_fields = ["date", "temperature", "temperature_time"]
    if not all(key in data for key in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    record = TemperatureRecord(
        child_id=child_id,
        date=data.get("date"),
        temperature=data.get("temperature"),
        temperature_time=data.get("temperature_time")
    )
    db.session.add(record)
    db.session.commit()
    return jsonify({
        "status": "success",
        "message": "Temperature record added",
        "id": record.id
    }), 201


@temperature_bp.route("/children/<int:child_id>/temperature/<int:record_id>", methods=["DELETE"])
def delete_temperature_record(child_id, record_id):
    record = TemperatureRecord.query.filter_by(id=record_id, child_id=child_id).first_or_404()
    db.session.delete(record)
    db.session.commit()
    return jsonify({"status": "success", "message": "Temperature record deleted"})