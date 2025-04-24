from flask import Blueprint, jsonify, request
from ..models import Child
from ..extensions import db

child_bp = Blueprint("child", __name__, url_prefix="/children")

@child_bp.route("/", methods=["GET"])
def get_all_children():
    children = Child.query.all()
    results = [
        {
            "id": child.id,
            "name": child.name,
            "sex": child.sex,
            "date_of_birth": child.date_of_birth,
        } for child in children
    ]
    return jsonify({"status": "success", "results": results})

@child_bp.route("/<int:id>", methods=["GET"])
def get_child(id):
    child = Child.query.get_or_404(id)
    return jsonify({
        "status": "success",
        "results": {
            "id": child.id,
            "name": child.name,
            "sex": child.sex,
            "date_of_birth": child.date_of_birth,
        }
    })

@child_bp.route("/", methods=["POST"])
def add_child():
    data = request.json
    child = Child(
        name=data.get("name"),
        sex=data.get("sex"),
        date_of_birth=data.get("date_of_birth")
    )
    db.session.add(child)
    db.session.commit()
    return jsonify({"status": "success", "message": "Child added"})

@child_bp.route("/<int:id>", methods=["PUT"])
def update_child(id):
    child = Child.query.get_or_404(id)
    data = request.json
    child.name = data.get("name", child.name)
    child.sex = data.get("sex", child.sex)
    child.date_of_birth = data.get("date_of_birth", child.date_of_birth)
    db.session.commit()
    return jsonify({"status": "success", "message": "Child updated"})

@child_bp.route("/<int:id>", methods=["DELETE"])
def delete_child(id):
    child = Child.query.get_or_404(id)
    db.session.delete(child)
    db.session.commit()
    return jsonify({"status": "success", "message": "Child deleted"})