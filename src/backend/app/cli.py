import click
from .extensions import db

def register_commands(app):
    @app.cli.command("create")
    def create_db():
        db.drop_all()
        db.create_all()
        click.echo("Database created!")