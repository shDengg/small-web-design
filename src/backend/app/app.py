from flask import Flask, request, jsonify
from flask.views import MethodView


from extensions import db, cors
from models import Child, SleepRecord, NappyChangeRecord, FeedingRecord, MedicationRecord, GrowthRecord, \
    TemperatureRecord

app = Flask(__name__)
# Initial Database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///children.sqlite'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
cors.init_app(app)


# Use Command line -flask create to create database
@app.cli.command('create')
def create():
    db.drop_all()
    db.create_all()


@app.route('/')
def home_page():
    return 'Welcome to the children health tracking app.'


class ChildApi(MethodView):
    def get(self, id):
        if not id:
            children: [Child] = Child.query.all()
            results = [
                {
                    'id': child.id,
                    'name': child.name,
                    'sex': child.sex,
                    'date_of_birth': child.date_of_birth,
                } for child in children
            ]
            return {
                'status': 'success',
                'message': 'Data query successful',
                'results': results
            }

        child: [Child] = Child.query.get(id)
        return {
            'status': 'success',
            'message': 'Data query successful',
            'results': {
                'id': child.id,
                'name': child.name,
                'sex': child.sex,
                'date_of_birth': child.date_of_birth,
            }
        }

    def post(self):
        form = request.json
        child = Child()
        child.name = form.get('name')
        child.sex = form.get('sex')
        child.date_of_birth = form.get('date_of_birth')
        db.session.add(child)
        db.session.commit()
        # name, sex, data_of_birth
        return {
            'status': 'success',
            'message': 'Data Add Successful'
        }

    def delete(self, id):
        child = Child.query.get(id)
        db.session.delete(child)
        db.session.commit()
        return {
            'status': 'Success',
            'message': 'Data Delete Successful',
        }

    def put(self, id):
        child: Child = Child.query.get(id)
        child.name = request.json['name']
        child.sex = request.json['sex']
        child.date_of_birth = request.json['date_of_birth']
        db.session.commit()
        return {
            'status': 'Success',
            'message': 'Data Modify Successful',
        }


child_view = ChildApi.as_view('child_api')
app.add_url_rule('/children/', defaults={'id': None},
                 view_func=child_view, methods=['GET', ])
app.add_url_rule('/children', view_func=child_view, methods=['POST', ])
app.add_url_rule('/children/<int:id>/', view_func=child_view,
                 methods=['GET', 'PUT', 'DELETE'])


class SleepRecordApi(MethodView):
    def get(self, child_id):
        if not child_id:
            return jsonify({'error': 'Child ID is required'}), 400

        records = SleepRecord.query.filter_by(child_id=child_id).order_by(SleepRecord.start_time.desc()).all()

        results = [{
            'id': record.id,
            'child_id': record.child_id,
            'sleep_date': record.sleep_date,
            'sleep_type': record.sleep_type,
            'start_time': record.start_time,
            'end_time': record.end_time
        } for record in records]

        return jsonify({
            'status': 'success',
            'results': results
        })

    def post(self, child_id):
        # ADD
        child = Child.query.get(child_id)
        if not child:
            return jsonify({'error': 'Child not found'}), 404

        # Get post data
        data = request.json

        # Verify
        if not all(key in data for key in ['start_time', 'end_time']):
            return jsonify({'error': 'Start time and end time are required'}), 400

        try:
            sleep_date = (data['sleep_date'])
            sleep_type = data['sleep_type']
            start_time = data['start_time']
            end_time = data['end_time']

            # Create sleep code
            sleep_record = SleepRecord(
                child_id=child_id,
                sleep_date=sleep_date,
                sleep_type=sleep_type,
                start_time=start_time,
                end_time=end_time
            )

            db.session.add(sleep_record)
            db.session.commit()

            return jsonify({
                'status': 'success',
                'message': 'Sleep record added successfully',
                'id': sleep_record.id,
                'sleep_date': sleep_record.sleep_date,
                'sleep_type': sleep_record.sleep_type,
                'start_time': sleep_record.start_time,
                'end_time': sleep_record.end_time
            }), 201

        except ValueError:
            return jsonify({
                'error': 'Invalid datetime format.'
            }), 400

    def delete(self, child_id, record_id):
        # Delete clear
        record = SleepRecord.query.filter_by(id=record_id, child_id=child_id).first()

        if not record:
            return jsonify({'error': 'Record not found'}), 404

        db.session.delete(record)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Sleep record deleted successfully'
        })


# sleepRecord router
sleep_record_view = SleepRecordApi.as_view('sleep_record_api')
app.add_url_rule('/children/<int:child_id>/sleep',
                 view_func=sleep_record_view,
                 methods=['GET', 'POST'])
app.add_url_rule('/children/<int:child_id>/sleep/<int:record_id>',
                 view_func=sleep_record_view,
                 methods=['DELETE'])


# Tracking the feeding/eating pattern of a child:

# Tracking of the child's Nappy/Nappy change:
class NappyChangeRecordApi(MethodView):
    def get(self, child_id):
        if not child_id:
            return jsonify({'error': 'Failed to get child ID'}), 400

        change_records = NappyChangeRecord.query.filter_by(child_id=child_id).all()

        change_results = [{
            'id': change_record.id,
            'child_id': change_record.child_id,
            'change_date': change_record.change_date,
            'change_time': change_record.change_time,
            'change_type': change_record.change_type,

        } for change_record in change_records]

        return jsonify({
            'status': 'success',
            'results': change_results
        })

    def post(self, child_id):
        child = Child.query.get(child_id)
        if not child:
            return jsonify({'error': 'Child ID not found'}), 404

        data = request.json

        try:
            change_date = data['change_date']
            change_time = data['change_time']
            change_type = data['change_type']

            change_record = NappyChangeRecord(
                child_id=child_id,
                change_date=change_date,
                change_time=change_time,
                change_type=change_type,
            )

            db.session.add(change_record)
            db.session.commit()

            return jsonify({
                'status': 'success',
                'message': 'Nappy Change Record added successfully',
                'id': change_record.id,
                'change_date': change_record.change_date,
                'change_time': change_record.change_time,
                'change_type': change_record.change_type,
            }), 201

        except ValueError:
            return jsonify({
                'error': 'Invalid date format.'
            }), 400

    def delete(self, child_id, record_id):
        change_record = NappyChangeRecord.query.filter_by(id=record_id, child_id=child_id).first()

        if not change_record:
            return jsonify({'error': 'Record not found'}), 404

        db.session.delete(change_record)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Nappy Change Record deleted successfully'
        })

# Change record router
change_nappy_record_view = NappyChangeRecordApi.as_view('nappy_change_record_api')
app.add_url_rule('/children/<int:child_id>/nappy',
                 view_func=change_nappy_record_view,
                 methods=['GET', 'POST']
                 )
app.add_url_rule('/children/<int:child_id>/nappy/<int:record_id>',
                 view_func=change_nappy_record_view,
                 methods=['DELETE']
                 )

class FeedRecordApi(MethodView):
    def get(self, child_id):
        if not child_id:
            return jsonify({'error': 'Failed to get child ID'}), 400

        feed_records = FeedingRecord.query.filter_by(child_id=child_id).all()

        results = [{
            'id': record.id,
            'child_id': record.child_id,
            'feed_date': record.feed_date,
            'feed_time': record.feed_time,
            'food_name': record.food_name,
            'feed_type': record.feed_type,
            'feed_amount': record.feed_amount
            # 'feed_solid_amount': record.feed_solid_amount,
            # 'feed_liquid_amount': record.feed_liquid_amount
        } for record in feed_records]

        return jsonify({
            'status': 'success',
            'results': results
        })

    def post(self, child_id):
        child = Child.query.get(child_id)
        if not child:
            return jsonify({'error': 'Child ID not found'}), 404

        data = request.json

        try:
            feed_date = data['feed_date']
            feed_time = data['feed_time']
            food_name = data['food_name']
            feed_type = data['feed_type']
            feed_amount = data['feed_amount']
            # feed_solid_amount = data['feed_solid_amount']
            # feed_liquid_amount = data['feed_liquid_amount']

            feed_record = FeedingRecord(
                child_id=child_id,
                feed_date=feed_date,
                feed_time=feed_time,
                food_name=food_name,
                feed_type=feed_type,
                feed_amount=feed_amount
                # feed_solid_amount=feed_solid_amount,
                # feed_liquid_amount=feed_liquid_amount
            )

            db.session.add(feed_record)
            db.session.commit()

            return jsonify({
                'status': 'success',
                'message': 'Feeding Record added successfully',
                'id': feed_record.id,
                'feed_date': feed_record.feed_date,
                'feed_time': feed_record.feed_time,
                'food_name': feed_record.food_name,
                'feed_type': feed_record.feed_type,
                'feed_amount': feed_record.feed_amount
                # 'feed_solid_amount': feed_record.feed_solid_amount,
                # 'feed_liquid_amount': feed_record.feed_liquid_amount
            }), 201

        except ValueError:
            return jsonify({
                'error': 'Invalid date format.'
            }), 400

    def delete(self, child_id, record_id):
        feeding_record = FeedingRecord.query.filter_by(id=record_id, child_id=child_id).first()

        if not feeding_record:
            return jsonify({'error': 'Record not found'}), 404

        db.session.delete(feeding_record)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Feeding Record deleted successfully'
        })

# Routers
feed_record_view = FeedRecordApi.as_view('feed_record_api')
app.add_url_rule('/children/<int:child_id>/feed',
                 view_func=feed_record_view,
                 methods=['GET', 'POST'])
app.add_url_rule('/children/<int:child_id>/feed/<int:record_id>',
                 view_func=feed_record_view,
                 methods=['DELETE'])

class MedicationRecordApi(MethodView):
    def get(self, child_id):
        if not child_id:
            return jsonify({'error': 'Failed to get child ID'}), 400

        medication_records = MedicationRecord.query.filter_by(child_id=child_id).all()

        results = [{
            'id': record.id,
            'child_id': record.child_id,
            'medication_date': record.medication_date,
            'medication_time': record.medication_time,
            'medication_type': record.medication_type,
            'dosage': record.dosage
        } for record in medication_records]

        return jsonify({
            'status': 'success',
            'results': results
        })

    def post(self, child_id):
        child = Child.query.get(child_id)
        if not child:
            return jsonify({'error': 'Child ID not found'}), 404

        data = request.json

        try:
            medication_type = data['medication_type']
            medication_date = data['medication_date']
            medication_time = data['medication_time']
            dosage = data['dosage']

            medication_record = MedicationRecord(
                child_id=child_id,
                medication_date=medication_date,
                medication_time=medication_time,
                medication_type=medication_type,
                dosage=dosage
            )

            db.session.add(medication_record)
            db.session.commit()

            return jsonify({
                'status': 'success',
                'message': 'Medication Record added successfully',
                'id': medication_record.id,
                'medication_date': medication_record.medication_date,
                'medication_time': medication_record.medication_time,
                'dosage': medication_record.dosage
            })

        except ValueError:
            return jsonify({
                'error': 'Invalid date format.'
            }), 400

    def delete(self, child_id, record_id):
        medication_record = MedicationRecord.query.filter_by(id=record_id).first()

        if not medication_record:
            return jsonify({'error': 'Record not found'}), 404

        db.session.delete(medication_record)
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Medication Record deleted successfully'
        })
# Router
medication_record_view = MedicationRecordApi.as_view('medication_record_api')
app.add_url_rule('/children/<int:child_id>/medication',
                 view_func=medication_record_view,
                 methods=['GET', 'POST'])
app.add_url_rule('/children/<int:child_id>/medication/<int:record_id>',
                 view_func=medication_record_view,
                 methods=['DELETE'])

# Temperature Record
class TemperatureRecordApi(MethodView):
    def get(self, child_id):
        if not child_id:
            return jsonify({'error': 'Failed to get child ID or record ID'}), 400

        temperature_records = TemperatureRecord.query.filter_by(child_id=child_id).all()

        results = [{
            'id': record.id,
            'child_id': record.child_id,
            'date': record.date,
            'temperature': record.temperature,
            'temperature_time': record.temperature_time,

        } for record in temperature_records]

        return jsonify({
            'status': 'success',
            'results': results
        })


    def post(self, child_id):
        child = Child.query.get(child_id)
        if not child:
            return jsonify({'error': 'Child ID not found'}), 404

        data = request.json

        try:
            date = data['date']
            temperature = data['temperature']
            temperature_time = data['temperature_time']

            temperature_record = TemperatureRecord(
                child_id=child_id,
                date=date,
                temperature=temperature,
                temperature_time=temperature_time
            )

            db.session.add(temperature_record)
            db.session.commit()

            return jsonify({
                'status': 'success',
                'message': 'Temperature Record added successfully',
                'id': temperature_record.id,
                'date': temperature_record.date,
                'temperature': temperature_record.temperature,
                'temperature_time': temperature_record.temperature_time
            }), 201

        except ValueError:
            return jsonify({
                'error': 'Invalid data.'
            })

    def delete(self, child_id, record_id):
        temperature_record = TemperatureRecord.query.filter_by(id=record_id, child_id=child_id).first()

        db.session.delete(temperature_record)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Temperature Record deleted successfully'
        })
# Router
temperature_record_view = TemperatureRecordApi.as_view('temperature_record_api')
app.add_url_rule('/children/<int:child_id>/temperature',
                 view_func=temperature_record_view,
                 methods=['GET', 'POST'])
app.add_url_rule('/children/<int:child_id>/temperature/<int:record_id>',
                 view_func=temperature_record_view,
                 methods=['DELETE'])


# GrowthRecord
class GrowthRecordApi(MethodView):
    def get(self, child_id):
        if not child_id:
            return jsonify({'error': 'Failed to get child ID'}), 400

        growth_records = GrowthRecord.query.filter_by(child_id=child_id).all()

        results = [{
            'id': record.id,
            'child_id': record.child_id,
            'growth_date': record.growth_date,
            'growth_type': record.growth_type,
            'weight': record.weight,
            'height': record.height,
        } for record in growth_records]

        return jsonify({
            'status': 'success',
            'results': results
        })

    def post(self, child_id):
        child = Child.query.get(child_id)
        if not child:
            return jsonify({'error': 'Child ID not found'}), 404

        data = request.json

        try:
            growth_date = data['growth_date']
            growth_type = data['growth_type']
            weigth = data['weight']
            height = data['height']

            growth_record = GrowthRecord(
                child_id=child_id,
                growth_date=growth_date,
                growth_type=growth_type,
                weight=weigth,
                height=height,
            )

            db.session.add(growth_record)
            db.session.commit()

            return jsonify({
                'status': 'success',
                'message': 'Growth Record added successfully',
                'id': growth_record.id,
                'growth_date': growth_record.growth_date,
                'growth_type': growth_record.growth_type,
                'weight': growth_record.weight,
                'height': growth_record.height,
            }), 201

        except ValueError:
            return jsonify({
                'error': 'Invalid input.'
            }), 400

    def delete(self, child_id, record_id):
        growth_record = GrowthRecord.query.filter_by(id=record_id).first()
        if not growth_record:
            return jsonify({'error': 'Record not found'}), 404

        db.session.delete(growth_record)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Growth Record deleted successfully'
        })

# Router
growth_record_view = GrowthRecordApi.as_view('growth_record_api')
app.add_url_rule('/children/<int:child_id>/growth',
                 view_func=growth_record_view,
                 methods=['GET', 'POST'])
app.add_url_rule('/children/<int:child_id>/growth/<int:record_id>',
                 view_func=growth_record_view,
                 methods=['DELETE'])

if __name__ == '__main__':
    app.run(debug=True)
