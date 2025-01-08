import os
import logging
import traceback
from logging.handlers import RotatingFileHandler
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def create_app() -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)

    # Enable CORS for all routes
    CORS(app)

    # Load configuration
    configure_app(app)

    # Set up logging
    configure_logging()

    # Register error handlers
    register_error_handlers(app)

    # Register routes
    register_routes(app)

    return app

def configure_app(app: Flask) -> None:
    """Load configurations into the Flask app."""
    app.config['JSON_SORT_KEYS'] = False  # Do not sort keys in JSON responses
    app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'

    # Security configurations
    app.config['SESSION_COOKIE_SECURE'] = os.getenv('SESSION_COOKIE_SECURE', 'true').lower() == 'true'
    app.config['SESSION_COOKIE_HTTPONLY'] = os.getenv('SESSION_COOKIE_HTTPONLY', 'true').lower() == 'true'

def configure_logging() -> None:
    """Set up logging with file rotation."""
    log_level = logging.DEBUG if os.getenv('FLASK_DEBUG', 'false').lower() == 'true' else logging.INFO
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)

    # File handler with rotation
    file_handler = RotatingFileHandler('server.log', maxBytes=5 * 1024 * 1024, backupCount=3)
    file_handler.setLevel(log_level)
    file_handler.setFormatter(formatter)

    # Configure root logger
    logging.basicConfig(level=log_level, handlers=[console_handler, file_handler])
    logger = logging.getLogger(__name__)
    logger.info("Logging is configured.")

def register_error_handlers(app: Flask) -> None:
    """Register custom error handlers for the Flask app."""
    @app.errorhandler(HTTPException)
    def handle_http_exception(e: HTTPException):
        logging.error(f"HTTP error occurred: {e}")
        return jsonify({"error": e.description, "code": e.code}), e.code

    @app.errorhandler(Exception)
    def handle_exception(e: Exception):
        logging.error(f"An error occurred: {e}")
        if app.config['DEBUG']:
            logging.debug(traceback.format_exc())  # Detailed traceback in dev mode
            return jsonify({"error": "An internal error occurred.", "details": str(e)}), 500
        return jsonify({"error": "An internal error occurred."}), 500

def register_routes(app: Flask) -> None:
    """Register application routes."""
    @app.route('/')
    def home():
        logging.info("Home route accessed")
        return jsonify({"message": "Welcome to the enhanced Flask server!"})

    @app.route('/api/v1/data', methods=['GET'])
    def get_data():
        logging.info("Data route accessed")
        data = {"key": "value"}
        return jsonify(data)

    @app.route('/api/v1/echo', methods=['POST'])
    def echo():
        """Echo back the received JSON data."""
        logging.info("Echo route accessed")
        data = request.get_json()
        if not data:
            logging.warning("No JSON data received in echo route.")
            return jsonify({"error": "No JSON data received"}), 400
        return jsonify({"received": data})

    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint."""
        logging.info("Health check route accessed")
        return jsonify({"status": "healthy"})

if __name__ == '__main__':
    # Validate critical environment variables
    port = int(os.getenv('PORT', 5050))
    if not os.getenv('FLASK_DEBUG'):
        logging.warning("FLASK_DEBUG is not set. Defaulting to 'false'.")

    app = create_app()
    app.run(host='0.0.0.0', port=port, debug=app.config['DEBUG'])
