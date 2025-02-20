
#  Copyright (c) 2025, Helloblue Inc.
#  Open-Source Community Edition

#  Permission is hereby granted, free of charge, to any person obtaining a copy
#  of this software and associated documentation files (the "Software"), to use,
#  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
#  the Software, subject to the following conditions:

#  1. The above copyright notice and this permission notice shall be included in
#     all copies or substantial portions of the Software.
#  2. Contributions to this project are welcome and must adhere to the project's
#     contribution guidelines.
#  3. The name "Helloblue Inc." and its contributors may not be used to endorse
#     or promote products derived from this software without prior written consent.

#  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
#  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
#  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
#  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
#  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
#  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
#  THE SOFTWARE.

from flask import Flask, jsonify, request # type: ignore
import platform
import datetime
import socket

app = Flask(__name__)  # Initialize Flask app


@app.route('/')
def home():
    """Home route with system details and usage instructions."""
    return jsonify({
        "message": "Welcome to the enhanced Flask server!",
        "instructions": "Use the '/health', '/info', and '/echo' routes to explore server capabilities.",
        "server": {
            "name": socket.gethostname(),
            "platform": platform.system(),
            "version": platform.version(),
            "release": platform.release(),
            "architecture": platform.architecture()[0],
        },
        "datetime": datetime.datetime.now().isoformat()
    })


@app.route('/health', methods=['GET'])
def health_check():
    """Health check route to confirm the server is running."""
    return jsonify({
        "status": "healthy",
        "uptime": datetime.datetime.now().isoformat(),
    })


@app.route('/info', methods=['GET'])
def server_info():
    """Route to display server information."""
    return jsonify({
        "server_name": socket.gethostname(),
        "platform": platform.system(),
        "platform_version": platform.version(),
        "platform_release": platform.release(),
        "architecture": platform.architecture()[0],
        "ip_address": socket.gethostbyname(socket.gethostname()),
    })


@app.route('/echo', methods=['POST'])
def echo():
    """Route to echo back the received JSON data."""
    data = request.get_json()
    if not data:
        return jsonify({
            "error": "No data received",
            "usage": "Send a JSON payload to this endpoint, and it will echo it back."
        }), 400
    return jsonify({
        "message": "Echo successful!",
        "received_data": data
    })


@app.errorhandler(404)
def not_found_error(e):
    """Custom 404 error handler."""
    return jsonify({
        "error": "The requested URL was not found on the server. Please check the URL and try again.",
        "suggested_routes": ["/", "/health", "/info", "/echo"],
        "code": 404
    }), 404


@app.errorhandler(500)
def internal_error(e):
    """Custom 500 error handler."""
    return jsonify({
        "error": "An internal server error occurred. Please try again later.",
        "code": 500
    }), 500


@app.errorhandler(Exception)
def global_error_handler(e):
    """Catch-all error handler for unexpected exceptions."""
    return jsonify({
        "error": "An unexpected error occurred.",
        "details": str(e),
        "code": 500
    }), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
