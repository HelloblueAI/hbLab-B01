import pytest # type: ignore
from server import create_app
import traceback
import logging
from flask import jsonify # type: ignore
from werkzeug.exceptions import HTTPException # type: ignore

@pytest.fixture
def client():
    """Fixture to set up a test client."""
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_home(client):
    """Test the home route."""
    response = client.get('/')
    assert response.status_code == 200
    assert response.get_json() == {"message": "Welcome to the enhanced Flask server!"}

def test_get_data(client):
    """Test the /api/v1/data route."""
    response = client.get('/api/v1/data')
    assert response.status_code == 200
    assert response.get_json() == {"key": "value"}

def test_echo(client):
    """Test the /api/v1/echo route."""
    data = {"name": "Flask"}
    response = client.post('/api/v1/echo', json=data)
    assert response.status_code == 200
    assert response.get_json() == {"received": data}

def test_health(client):
    """Test the /health route."""
    response = client.get('/health')
    assert response.status_code == 200
    assert response.get_json() == {"status": "healthy"}

def test_error_handling(client):
    """Test a 404 error."""
    response = client.get('/nonexistent')
    assert response.status_code == 404
    expected_error = {
        "error": "The requested URL was not found on the server. If you entered the URL manually please check your spelling and try again.",
        "code": 404
    }
    assert response.get_json() == expected_error


def register_error_handlers(app):
    """Register custom error handlers for the Flask app."""
    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        logging.error(f"HTTP error occurred: {e}")
        error_message = e.description if e.code != 404 else "Not Found"
        return jsonify({"error": error_message, "code": e.code}), e.code

    @app.errorhandler(Exception)
    def handle_exception(e):
        logging.error(f"An error occurred: {e}")
        logging.debug(traceback.format_exc())  # Log detailed traceback
        return jsonify({"error": "An internal error occurred."}), 500
