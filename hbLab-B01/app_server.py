import os
import logging
from flask import Flask
from flask_cors import CORS

def create_app() -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)

    # Enable CORS
    CORS(app)

    # Additional configuration if necessary
    app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'

    @app.route('/')
    def home():
        return {"message": "Welcome to the Flask server!"}

    return app
