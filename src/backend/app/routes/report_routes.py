from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from ..models import Child, SleepRecord, FeedingRecord, NappyChangeRecord, MedicationRecord, TemperatureRecord, GrowthRecord

report_bp = Blueprint('report', __name__)

@report_bp.route('/children/<int:child_id>/daily-report', methods=['GET'])
def daily_report(child_id):
    """Get all data needed for a child's daily report"""
    date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
    
    # Get child information
    child = Child.query.get_or_404(child_id)
    
    # Get all records for the specified date
    sleep_records = SleepRecord.query.filter_by(child_id=child_id, sleep_date=date).all()
    feeding_records = FeedingRecord.query.filter_by(child_id=child_id, feed_date=date).all()
    nappy_records = NappyChangeRecord.query.filter_by(child_id=child_id, change_date=date).all()
    medication_records = MedicationRecord.query.filter_by(child_id=child_id, medication_date=date).all()
    temperature_records = TemperatureRecord.query.filter_by(child_id=child_id, date=date).all()
    growth_records = GrowthRecord.query.filter_by(child_id=child_id, growth_date=date).all()
    
    # Get last week's records for trend analysis
    last_week = (datetime.strptime(date, '%Y-%m-%d') - timedelta(days=7)).strftime('%Y-%m-%d')
    
    # Weekly sleep summary
    weekly_sleep = SleepRecord.query.filter(
        SleepRecord.child_id == child_id,
        SleepRecord.sleep_date >= last_week,
        SleepRecord.sleep_date <= date
    ).all()
    
    # Calculate sleep stats
    sleep_stats = {
        "total_sleep_minutes": 0,
        "avg_naps_per_day": 0,
        "days_with_records": set()
    }
    
    for record in weekly_sleep:
        sleep_stats["days_with_records"].add(record.sleep_date)
        
        # Calculate sleep duration
        start = datetime.strptime(record.start_time, '%H:%M')
        end = datetime.strptime(record.end_time, '%H:%M')
        
        # Handle overnight sleep (if end time is before start time)
        if end < start:
            end = end + timedelta(days=1)
            
        duration_minutes = (end - start).total_seconds() / 60
        sleep_stats["total_sleep_minutes"] += duration_minutes
        
        if record.sleep_type == "Day time nap":
            sleep_stats["avg_naps_per_day"] += 1
    
    # Calculate averages
    days_count = len(sleep_stats["days_with_records"]) or 1  # Avoid division by zero
    sleep_stats["avg_naps_per_day"] = round(sleep_stats["avg_naps_per_day"] / days_count, 1)
    sleep_stats["avg_sleep_hours"] = round(sleep_stats["total_sleep_minutes"] / days_count / 60, 1)
    
    # Clean up the set for JSON serialization
    sleep_stats.pop("days_with_records")
    
    # Today's records summary
    today_sleep_minutes = sum(
        (datetime.strptime(record.end_time, '%H:%M') - datetime.strptime(record.start_time, '%H:%M')).total_seconds() / 60
        for record in sleep_records
    )
    
    today_summary = {
        "sleep_hours": round(today_sleep_minutes / 60, 1),
        "naps_count": sum(1 for record in sleep_records if record.sleep_type == "Day time nap"),
        "feeds_count": len(feeding_records),
        "nappy_changes": len(nappy_records),
        "medication_given": len(medication_records) > 0,
        "temperature_taken": len(temperature_records) > 0
    }
    
    # Format records for the response
    response = {
        "child": {
            "id": child.id,
            "name": child.name,
            "sex": child.sex,
            "date_of_birth": child.date_of_birth,
            "age_months": calculate_age_months(child.date_of_birth, date)
        },
        "date": date,
        "today_summary": today_summary,
        "weekly_stats": {
            "sleep": sleep_stats
        },
        "records": {
            "sleep": [
                {
                    "id": record.id,
                    "sleep_type": record.sleep_type,
                    "start_time": record.start_time,
                    "end_time": record.end_time,
                    "duration_minutes": calculate_duration_minutes(record.start_time, record.end_time)
                } for record in sleep_records
            ],
            "feeding": [
                {
                    "id": record.id,
                    "feed_time": record.feed_time,
                    "feed_type": record.feed_type,
                    "food_name": record.food_name,
                    "feed_amount": record.feed_amount
                } for record in feeding_records
            ],
            "nappy": [
                {
                    "id": record.id,
                    "change_time": record.change_time,
                    "change_type": record.change_type
                } for record in nappy_records
            ],
            "medication": [
                {
                    "id": record.id,
                    "medication_time": record.medication_time,
                    "medication_type": record.medication_type,
                    "dosage": record.dosage
                } for record in medication_records
            ],
            "temperature": [
                {
                    "id": record.id,
                    "temperature_time": record.temperature_time,
                    "temperature": record.temperature
                } for record in temperature_records
            ],
            "growth": [
                {
                    "id": record.id,
                    "weight": record.weight,
                    "height": record.height
                } for record in growth_records
            ]
        }
    }
    
    return jsonify(response)

def calculate_age_months(birth_date_str, current_date_str):
    """Calculate age in months from birth date to current date"""
    birth_date = datetime.strptime(birth_date_str, '%Y-%m-%d')
    current_date = datetime.strptime(current_date_str, '%Y-%m-%d')
    
    months = (current_date.year - birth_date.year) * 12 + (current_date.month - birth_date.month)
    
    # Adjust for day of month
    if current_date.day < birth_date.day:
        months -= 1
        
    return months

def calculate_duration_minutes(start_time_str, end_time_str):
    """Calculate duration in minutes between two time strings"""
    start_time = datetime.strptime(start_time_str, '%H:%M')
    end_time = datetime.strptime(end_time_str, '%H:%M')
    
    # Handle overnight sleep (if end time is before start time)
    if end_time < start_time:
        end_time = end_time + timedelta(days=1)
        
    return round((end_time - start_time).total_seconds() / 60) 