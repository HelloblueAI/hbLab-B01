from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify({"message": "This is a Python-powered API!"})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
