from flask import Flask
from .config import Config
from .extensions import db, cors

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # init extension
    db.init_app(app)
    cors.init_app(app)

    # register blueprints
    from .routes.child import child_bp
    from .routes.sleep import sleep_bp
    from .routes.feed import feed_bp
    from .routes.nappy_change import nappy_bp
    from .routes.medication import medication_bp
    from .routes.temperature import temperature_bp
    from .routes.growth import growth_bp
    from .routes.report_routes import report_bp

    app.register_blueprint(child_bp)
    app.register_blueprint(sleep_bp)
    app.register_blueprint(feed_bp)
    app.register_blueprint(nappy_bp)
    app.register_blueprint(medication_bp)
    app.register_blueprint(temperature_bp)
    app.register_blueprint(growth_bp)
    #Register blueprint with API prefix
    app.register_blueprint(report_bp, url_prefix='/api')

    # register CLI command
    from .cli import register_commands
    register_commands(app)

    return app