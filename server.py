import os
import logging
import traceback
from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load configuration
app.config['JSON_SORT_KEYS'] = False  # Do not sort keys in JSON responses
app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'

# Security configurations
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True

# Custom error handler for HTTP exceptions
@app.errorhandler(HTTPException)
def handle_http_exception(e):
    logger.error(f"HTTP error occurred: {e}")
    return jsonify({"error": e.description, "code": e.code}), e.code

# Generic error handler
@app.errorhandler(Exception)
def handle_exception(e):
    logger.error(f"An error occurred: {e}")
    logger.debug(traceback.format_exc())  # Log detailed traceback
    return jsonify({"error": "An internal error occurred."}), 500

# Example route
@app.route('/')
def home():
    logger.info("Home route accessed")
    return jsonify({"message": "Welcome to the powerful Flask server!"})

# Example API versioning route
@app.route('/api/v1/data', methods=['GET'])
def get_data():
    logger.info("Data route accessed")
    data = {"key": "value"}
    return jsonify(data)

# Start the Flask server
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=app.config['DEBUG'])
