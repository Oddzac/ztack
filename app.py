from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__)

LAYER_TYPES = {
    'Core': '#3b82f6',
    'Frontend': '#10b981',
    'Backend': '#f59e0b',
    'Database': '#8b5cf6',
    'DevOps': '#ef4444',
    'API': '#06b6d4',
    'Other': '#6b7280'
}

sample_project = {
    'name': 'Sample Project',
    'layers': [
        {'id': 1, 'name': 'React UI', 'type': 'Frontend', 'status': 'Active', 'description': 'User interface layer', 'technology': 'React 18, TypeScript', 'responsibilities': 'Render UI, handle user interactions', 'connections': [2], 'dependencies': [], 'visible': True, 'locked': False, 'substacks': [
            {'id': 11, 'name': 'Components', 'type': 'Frontend', 'status': 'Active', 'description': 'React components', 'technology': 'React', 'responsibilities': 'Reusable UI components', 'connections': [], 'dependencies': [], 'visible': True, 'locked': False},
            {'id': 12, 'name': 'State Management', 'type': 'Frontend', 'status': 'Active', 'description': 'Redux store', 'technology': 'Redux Toolkit', 'responsibilities': 'Global state management', 'connections': [], 'dependencies': [], 'visible': True, 'locked': False}
        ]},
        {'id': 2, 'name': 'REST API', 'type': 'API', 'status': 'Active', 'description': 'API gateway', 'technology': 'Express.js', 'responsibilities': 'Route requests, authentication', 'connections': [3], 'dependencies': [1], 'visible': True, 'locked': False, 'substacks': []},
        {'id': 3, 'name': 'Business Logic', 'type': 'Backend', 'status': 'Active', 'description': 'Core business logic', 'technology': 'Node.js', 'responsibilities': 'Process business rules', 'connections': [4], 'dependencies': [2], 'visible': True, 'locked': False, 'substacks': []},
        {'id': 4, 'name': 'PostgreSQL', 'type': 'Database', 'status': 'Active', 'description': 'Primary database', 'technology': 'PostgreSQL 15', 'responsibilities': 'Data persistence', 'connections': [], 'dependencies': [3], 'visible': True, 'locked': False, 'substacks': []},
    ]
}

@app.route('/')
def index():
    return render_template('index.html', layer_types=LAYER_TYPES)

@app.route('/api/project')
def get_project():
    return jsonify(sample_project)

@app.route('/api/project', methods=['POST'])
def save_project():
    data = request.json
    return jsonify({'success': True})

@app.route('/api/layer', methods=['POST'])
def add_layer():
    data = request.json
    return jsonify({'success': True, 'layer': data})

@app.route('/api/layer/<int:layer_id>', methods=['DELETE'])
def delete_layer(layer_id):
    return jsonify({'success': True})

@app.route('/api/layer/<int:layer_id>', methods=['PUT'])
def update_layer(layer_id):
    data = request.json
    return jsonify({'success': True, 'layer': data})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
