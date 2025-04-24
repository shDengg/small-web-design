from flask import Blueprint, jsonify, request
from ..models import GrowthRecord
from ..extensions import db

growth_bp = Blueprint("growth", __name__)


@growth_bp.route("/children/<int:child_id>/growth", methods=["GET"])
def get_growth_records(child_id):
    records = GrowthRecord.query.filter_by(child_id=child_id).all()
    results = [{
        "id": r.id,
        "child_id": r.child_id,
        "growth_date": r.growth_date,
        "weight": r.weight,
        "height": r.height
    } for r in records]
    return jsonify({"status": "success", "results": results})


@growth_bp.route("/children/<int:child_id>/growth", methods=["POST"])
def add_growth_record(child_id):
    data = request.json
    required_fields = ["growth_date", "weight", "height"]
    if not all(key in data for key in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    record = GrowthRecord(
        child_id=child_id,
        growth_date=data.get("growth_date"),
        weight=data.get("weight"),
        height=data.get("height")
    )
    db.session.add(record)
    db.session.commit()
    return jsonify({
        "status": "success",
        "message": "Growth record added",
        "id": record.id
    }), 201


@growth_bp.route("/children/<int:child_id>/growth/<int:record_id>", methods=["DELETE"])
def delete_growth_record(child_id, record_id):
    record = GrowthRecord.query.filter_by(id=record_id, child_id=child_id).first_or_404()
    db.session.delete(record)
    db.session.commit()
    return jsonify({"status": "success", "message": "Growth record deleted"})