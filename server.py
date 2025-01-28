import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, jsonify, request # type: ignore
from flask_cors import CORS # type: ignore
from werkzeug.exceptions import HTTPException # type: ignore
from dotenv import load_dotenv # type: ignore

# Load environment variables
load_dotenv()

def create_app() -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__, instance_relative_config=True)

    # Enable CORS
    CORS(app)

    # Load configuration
    configure_app(app)

    # Set up logging
    configure_logging()

    # Register routes and error handlers
    register_routes(app)
    register_error_handlers(app)

    return app

def configure_app(app: Flask) -> None:
    """Load configurations into the Flask app."""
    app.config['JSON_SORT_KEYS'] = False  # Preserve order in JSON responses
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
    logging.getLogger().info("Logging is configured.")

def register_routes(app: Flask) -> None:
    """Register application routes."""

    @app.route('/')
    def home():
        """Home route."""
        logging.info("Home route accessed.")
        return jsonify({"message": "Welcome to the enhanced Flask server!"})

    @app.route('/api/v1/data', methods=['GET'])
    def get_data():
        """Fetch static data."""
        logging.info("Data route accessed.")
        return jsonify({"key": "value"})

    @app.route('/api/v1/echo', methods=['POST'])
    def echo():
        """Echo back the received JSON data."""
        logging.info("Echo route accessed.")
        data = request.get_json()
        if not data:
            logging.warning("No data received in the echo route.")
            return jsonify({"error": "No data received"}), 400
        return jsonify({"received": data})

    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint."""
        logging.info("Health check route accessed.")
        return jsonify({"status": "healthy"})

def register_error_handlers(app: Flask) -> None:
    """Register custom error handlers for the Flask app."""

    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        """Handle HTTP exceptions."""
        logging.error(f"HTTP error occurred: {e}")
        return jsonify({
            "error": e.description,
            "code": e.code
        }), e.code

    @app.errorhandler(Exception)
    def handle_exception(e):
        """Handle generic exceptions."""
        logging.error(f"An unexpected error occurred: {e}")
        if app.config['DEBUG']:
            return jsonify({
                "error": "An internal error occurred.",
                "details": str(e)
            }), 500
        return jsonify({"error": "An internal error occurred."}), 500

if __name__ == '__main__':
    # Validate critical environment variables
    port = int(os.getenv('PORT', 5050))
    app = create_app()

    logging.info("Starting Flask server...")
    app.run(host='0.0.0.0', port=port, debug=app.config['DEBUG'])
