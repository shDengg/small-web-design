from .extensions import db

# Child information
class Child(db.Model):
    __tablename__ = 'child'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=False)
    sex = db.Column(db.String(20), nullable=False)
    date_of_birth = db.Column(db.String(20), nullable=False)
    
    # Define relationships with cascade delete
    sleep_records = db.relationship('SleepRecord', backref='child', cascade='all, delete-orphan')
    feeding_records = db.relationship('FeedingRecord', backref='child', cascade='all, delete-orphan')
    nappy_change_records = db.relationship('NappyChangeRecord', backref='child', cascade='all, delete-orphan')
    medication_records = db.relationship('MedicationRecord', backref='child', cascade='all, delete-orphan')
    temperature_records = db.relationship('TemperatureRecord', backref='child', cascade='all, delete-orphan')
    growth_records = db.relationship('GrowthRecord', backref='child', cascade='all, delete-orphan')

# Sleep Record
class SleepRecord(db.Model):
    __tablename__ = 'sleep_record'
    id = db.Column(db.Integer, primary_key=True)
    child_id = db.Column(db.Integer, db.ForeignKey('child.id'), nullable=False)
    sleep_date = db.Column(db.String(20), nullable=False)
    sleep_type = db.Column(db.String(20), nullable=False)
    start_time = db.Column(db.String(20), nullable=False)
    end_time = db.Column(db.String(20), nullable=False)
    # duration = db.Column(db.String(20), nullable=False)

class FeedingRecord(db.Model):
    __tablename__ = 'feeding_record'
    id = db.Column(db.Integer, primary_key=True)
    child_id = db.Column(db.Integer, db.ForeignKey('child.id'), nullable=False)
    feed_date = db.Column(db.String(20), nullable=False)
    feed_time = db.Column(db.String(20), nullable=False)
    feed_type = db.Column(db.String(20), nullable=False)
    food_name = db.Column(db.String(20), nullable=True)
    feed_amount = db.Column(db.String(20), nullable=True)
    # feed_solid_amount = db.Column(db.Float, nullable=True)
    # feed_liquid_amount = db.Column(db.String(20), nullable=True)

class NappyChangeRecord(db.Model):
    __tablename__ = 'nappy_change_record'
    id = db.Column(db.Integer, primary_key=True)
    child_id = db.Column(db.Integer, db.ForeignKey('child.id'), nullable=False)
    change_date = db.Column(db.String(20), nullable=False)
    change_time = db.Column(db.String(20), nullable=False)
    change_type = db.Column(db.String(20), nullable=False)

class MedicationRecord(db.Model):
    __tablename__ = 'medication_record'
    id = db.Column(db.Integer, primary_key=True)
    child_id = db.Column(db.Integer, db.ForeignKey('child.id'), nullable=False)
    medication_date = db.Column(db.String(20), nullable=False)
    medication_type = db.Column(db.String(20), nullable=False)
    medication_time = db.Column(db.String(20), nullable=False)
    dosage = db.Column(db.String(20), nullable=False)

class TemperatureRecord(db.Model):
    __tablename__ = 'temperature_record'
    id = db.Column(db.Integer, primary_key=True)
    child_id = db.Column(db.Integer, db.ForeignKey('child.id'), nullable=False)
    date = db.Column(db.String(20), nullable=False)
    temperature = db.Column(db.String(10), nullable=True)
    temperature_time = db.Column(db.String(20), nullable=True)

class GrowthRecord(db.Model):
    __tablename__ = 'growth_record'
    id = db.Column(db.Integer, primary_key=True)
    child_id = db.Column(db.Integer, db.ForeignKey('child.id'), nullable=False)
    growth_date = db.Column(db.String(10), nullable=False)
    weight = db.Column(db.String(10), nullable=False)
    height = db.Column(db.String(10), nullable=False)
