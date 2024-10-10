from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_httpauth import HTTPTokenAuth

app = Flask(__name__)

# Enable CORS
CORS(app)

# Configure the database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///items.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Initialize HTTP Token Authentication
auth = HTTPTokenAuth(scheme='Bearer')

# Sample token for demonstration purposes
tokens = {
    "user1": "your_secure_token_here"  # Replace with a secure token
}

@auth.verify_token
def verify_token(token):
    if token in tokens.values():
        return True
    return False

# Define the Item model
class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name}

# Create the database tables
with app.app_context():
    db.create_all()

@app.route('/api/data', methods=['GET'])
@auth.login_required
def get_data():
    items = Item.query.all()
    return jsonify([item.to_dict() for item in items])

@app.route('/api/data', methods=['POST'])
@auth.login_required
def create_item():
    data = request.get_json()
    if 'name' not in data:
        return jsonify({"error": "Missing name parameter"}), 400
    new_item = Item(name=data['name'])
    db.session.add(new_item)
    db.session.commit()
    return jsonify(new_item.to_dict()), 201

if __name__ == '__main__':
    app.run(port=5000, debug=True)
