from flask import Blueprint, jsonify, request
from ..models import FeedingRecord
from ..extensions import db

feed_bp = Blueprint("feed", __name__)


@feed_bp.route("/children/<int:child_id>/feed", methods=["GET"])
def get_feeding_records(child_id):
    records = FeedingRecord.query.filter_by(child_id=child_id).all()
    results = [{
        "id": r.id,
        "child_id": r.child_id,
        "feed_date": r.feed_date,
        "feed_time": r.feed_time,
        "food_name": r.food_name,
        "feed_type": r.feed_type,
        "feed_amount": r.feed_amount
    } for r in records]
    return jsonify({"status": "success", "results": results})


@feed_bp.route("/children/<int:child_id>/feed", methods=["POST"])
def add_feeding_record(child_id):
    data = request.json
    required_fields = ["feed_date", "feed_time", "feed_type"]
    if not all(key in data for key in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    record = FeedingRecord(
        child_id=child_id,
        feed_date=data.get("feed_date"),
        feed_time=data.get("feed_time"),
        food_name=data.get("food_name"),
        feed_type=data.get("feed_type"),
        feed_amount=data.get("feed_amount")
    )
    db.session.add(record)
    db.session.commit()
    return jsonify({
        "status": "success",
        "message": "Feeding record added",
        "id": record.id
    }), 201


@feed_bp.route("/children/<int:child_id>/feed/<int:record_id>", methods=["DELETE"])
def delete_feeding_record(child_id, record_id):
    record = FeedingRecord.query.filter_by(id=record_id, child_id=child_id).first_or_404()
    db.session.delete(record)
    db.session.commit()
    return jsonify({"status": "success", "message": "Feeding record deleted"})