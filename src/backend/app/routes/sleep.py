from flask import Blueprint, jsonify, request
from ..models import SleepRecord
from ..extensions import db

sleep_bp = Blueprint("sleep", __name__)


@sleep_bp.route("/children/<int:child_id>/sleep", methods=["GET"])
def get_sleep_records(child_id):
    records = SleepRecord.query.filter_by(child_id=child_id).order_by(SleepRecord.start_time.desc()).all()
    results = [{
        "id": r.id,
        "child_id": r.child_id,
        "sleep_date": r.sleep_date,
        "sleep_type": r.sleep_type,
        "start_time": r.start_time,
        "end_time": r.end_time
    } for r in records]
    return jsonify({"status": "success", "results": results})


@sleep_bp.route("/children/<int:child_id>/sleep", methods=["POST"])
def add_sleep_record(child_id):
    data = request.json
    if not all(key in data for key in ["start_time", "end_time"]):
        return jsonify({"error": "Missing required fields"}), 400

    record = SleepRecord(
        child_id=child_id,
        sleep_date=data.get("sleep_date"),
        sleep_type=data.get("sleep_type"),
        start_time=data.get("start_time"),
        end_time=data.get("end_time")
    )
    db.session.add(record)
    db.session.commit()
    return jsonify({
        "status": "success",
        "message": "Sleep record added",
        "id": record.id
    }), 201


@sleep_bp.route("/children/<int:child_id>/sleep/<int:record_id>", methods=["DELETE"])
def delete_sleep_record(child_id, record_id):
    record = SleepRecord.query.filter_by(id=record_id, child_id=child_id).first_or_404()
    db.session.delete(record)
    db.session.commit()
    return jsonify({"status": "success", "message": "Sleep record deleted"})