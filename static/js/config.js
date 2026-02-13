const LAYER_TYPES = {
    'Core': '#3b82f6',
    'Frontend': '#10b981',
    'Backend': '#f59e0b',
    'Database': '#8b5cf6',
    'DevOps': '#ef4444',
    'API': '#06b6d4',
    'Other': '#6b7280'
};

const CONNECTION_TYPES = {
    'HTTP': { label: 'HTTP/REST', color: '#3b82f6', pattern: [5, 5], width: 2 },
    'gRPC': { label: 'gRPC', color: '#8b5cf6', pattern: [8, 4], width: 2 },
    'Event': { label: 'Event Bus', color: '#f59e0b', pattern: [3, 3], width: 2 },
    'Database': { label: 'Database Query', color: '#06b6d4', pattern: [2, 4], width: 2 },
    'Cache': { label: 'Cache', color: '#10b981', pattern: [6, 2], width: 1.5 },
    'Message': { label: 'Message Queue', color: '#ef4444', pattern: [4, 4], width: 2 },
    'Sync': { label: 'Synchronous', color: '#64748b', pattern: [5, 5], width: 2 },
    'Async': { label: 'Asynchronous', color: '#94a3b8', pattern: [3, 3], width: 1.5 }
};

const SAMPLE_PROJECT = {
    'name': 'Sample Project',
    'layers': [
        {'id': 1, 'name': 'React UI', 'type': 'Frontend', 'status': 'Active', 'description': 'User interface layer', 'technology': 'React 18, TypeScript', 'responsibilities': 'Render UI, handle user interactions', 'connections': [2], 'dependencies': [], 'visible': true, 'locked': false, 'substacks': [
            {'id': 11, 'name': 'Components', 'type': 'Frontend', 'status': 'Active', 'description': 'React components', 'technology': 'React', 'responsibilities': 'Reusable UI components', 'connections': [], 'dependencies': [], 'visible': true, 'locked': false},
            {'id': 12, 'name': 'State Management', 'type': 'Frontend', 'status': 'Active', 'description': 'Redux store', 'technology': 'Redux Toolkit', 'responsibilities': 'Global state management', 'connections': [], 'dependencies': [], 'visible': true, 'locked': false}
        ]},
        {'id': 2, 'name': 'REST API', 'type': 'API', 'status': 'Active', 'description': 'API gateway', 'technology': 'Express.js', 'responsibilities': 'Route requests, authentication', 'connections': [3], 'dependencies': [1], 'visible': true, 'locked': false, 'substacks': []},
        {'id': 3, 'name': 'Business Logic', 'type': 'Backend', 'status': 'Active', 'description': 'Core business logic', 'technology': 'Node.js', 'responsibilities': 'Process business rules', 'connections': [4], 'dependencies': [2], 'visible': true, 'locked': false, 'substacks': []},
        {'id': 4, 'name': 'PostgreSQL', 'type': 'Database', 'status': 'Active', 'description': 'Primary database', 'technology': 'PostgreSQL 15', 'responsibilities': 'Data persistence', 'connections': [], 'dependencies': [3], 'visible': true, 'locked': false, 'substacks': []}
    ]
};
