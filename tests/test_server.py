import pytest # type: ignore
from app_server import create_app
from flask import jsonify # type: ignore
from werkzeug.exceptions import HTTPException # type: ignore
import logging
import traceback
import os
import sys

# Add the project root to sys.path for module imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


# --- Client Setup ---
@pytest.fixture(scope="module")
def client():
    """Set up and return a Flask test client."""
    logging.info("Setting up Flask test client.")
    app = create_app()
    app.config['TESTING'] = True
    app.config['DEBUG'] = False
    app.config['PROPAGATE_EXCEPTIONS'] = True
    with app.test_client() as client:
        yield client


# --- Functional Tests ---
@pytest.mark.parametrize(
    "route, expected_status, expected_response",
    [
        ('/', 200, {"message": "Welcome to the enhanced Flask server!"}),
        ('/health', 200, {"status": "healthy"}),
    ]
)
def test_static_routes(client, route, expected_status, expected_response):
    """Test static routes with parameterized input."""
    response = client.get(route)
    assert response.status_code == expected_status, f"Unexpected status code for route {route}"
    assert response.get_json() == expected_response, f"Unexpected response for route {route}"


def test_get_data(client):
    """Test the /api/v1/data route."""
    response = client.get('/api/v1/data')
    assert response.status_code == 200, "Expected status code 200 for '/api/v1/data' route."
    assert response.get_json() == {"key": "value"}, "Unexpected response from '/api/v1/data'"


@pytest.mark.parametrize(
    "payload, expected_status, expected_response",
    [
        ({"name": "Flask"}, 200, {"received": {"name": "Flask"}}),
        (None, 400, {"error": "No data received"}),
    ]
)
def test_echo(client, payload, expected_status, expected_response):
    """Test the /api/v1/echo route with and without payload."""
    response = client.post('/api/v1/echo', json=payload)
    assert response.status_code == expected_status, f"Unexpected status code for payload {payload}"
    assert response.get_json() == expected_response, f"Unexpected response for payload {payload}"



# --- Error Handling Tests ---
@pytest.mark.error_handling
def test_error_handling_404(client):
    """Test a 404 error for an unknown route."""
    response = client.get('/nonexistent')
    assert response.status_code == 404, "Expected status code 404 for a nonexistent route."
    assert response.get_json() == {
        "error": "The requested URL was not found on the server. If you entered the URL manually please check your spelling and try again.",
        "code": 404
    }, "Unexpected response for a nonexistent route."


@pytest.mark.error_handling
def test_error_handling_internal_error(client):
    """Test a 500 internal server error by triggering an unhandled exception."""
    @client.application.route('/trigger-error')
    def trigger_error():
        raise RuntimeError("Intentional error for testing.")

    response = client.get('/trigger-error')
    assert response.status_code == 500, "Expected status code 500 for internal server error."
    assert response.get_json() == {"error": "An internal error occurred."}, \
        "Unexpected response for internal server error."
