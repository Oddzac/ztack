// Layer type color mappings
const LAYER_TYPES = {
    'Core': '#3b82f6',
    'Frontend': '#10b981',
    'Backend': '#f59e0b',
    'Database': '#8b5cf6',
    'DevOps': '#ef4444',
    'API': '#06b6d4',
    'Other': '#6b7280'
};

// Sample project data
const SAMPLE_PROJECT = {
    name: 'Sample Project',
    layers: [
        {
            id: 1,
            name: 'React UI',
            type: 'Frontend',
            status: 'Active',
            description: 'User interface layer',
            technology: 'React 18, TypeScript',
            responsibilities: 'Render UI, handle user interactions',
            connections: [2],
            dependencies: [],
            visible: true,
            locked: false,
            substacks: [
                {
                    id: 11,
                    name: 'Components',
                    type: 'Frontend',
                    status: 'Active',
                    description: 'React components',
                    technology: 'React',
                    responsibilities: 'Reusable UI components',
                    connections: [],
                    dependencies: [],
                    visible: true,
                    locked: false
                },
                {
                    id: 12,
                    name: 'State Management',
                    type: 'Frontend',
                    status: 'Active',
                    description: 'Redux store',
                    technology: 'Redux Toolkit',
                    responsibilities: 'Global state management',
                    connections: [],
                    dependencies: [],
                    visible: true,
                    locked: false
                }
            ]
        },
        {
            id: 2,
            name: 'REST API',
            type: 'API',
            status: 'Active',
            description: 'API gateway',
            technology: 'Express.js',
            responsibilities: 'Route requests, authentication',
            connections: [3],
            dependencies: [1],
            visible: true,
            locked: false,
            substacks: []
        },
        {
            id: 3,
            name: 'Business Logic',
            type: 'Backend',
            status: 'Active',
            description: 'Core business logic',
            technology: 'Node.js',
            responsibilities: 'Process business rules',
            connections: [4],
            dependencies: [2],
            visible: true,
            locked: false,
            substacks: []
        },
        {
            id: 4,
            name: 'PostgreSQL',
            type: 'Database',
            status: 'Active',
            description: 'Primary database',
            technology: 'PostgreSQL 15',
            responsibilities: 'Data persistence',
            connections: [],
            dependencies: [3],
            visible: true,
            locked: false,
            substacks: []
        }
    ]
};

// Template projects
const TEMPLATES = {
    microservices: {
        name: 'Microservices Architecture',
        layers: [
            { id: 1, name: 'API Gateway', type: 'API', status: 'Active', description: 'Entry point for all requests', technology: 'Kong/NGINX', responsibilities: 'Route, authenticate, rate limit', connections: [2, 3, 4], dependencies: [], visible: true, locked: false, substacks: [] },
            { id: 2, name: 'User Service', type: 'Backend', status: 'Active', description: 'User management', technology: 'Node.js', responsibilities: 'User CRUD operations', connections: [5], dependencies: [1], visible: true, locked: false, substacks: [] },
            { id: 3, name: 'Order Service', type: 'Backend', status: 'Active', description: 'Order processing', technology: 'Java Spring', responsibilities: 'Order management', connections: [6], dependencies: [1], visible: true, locked: false, substacks: [] },
            { id: 4, name: 'Payment Service', type: 'Backend', status: 'Active', description: 'Payment processing', technology: 'Python', responsibilities: 'Handle payments', connections: [7], dependencies: [1], visible: true, locked: false, substacks: [] },
            { id: 5, name: 'User DB', type: 'Database', status: 'Active', description: 'User data', technology: 'PostgreSQL', responsibilities: 'Store user data', connections: [], dependencies: [2], visible: true, locked: false, substacks: [] },
            { id: 6, name: 'Order DB', type: 'Database', status: 'Active', description: 'Order data', technology: 'MongoDB', responsibilities: 'Store orders', connections: [], dependencies: [3], visible: true, locked: false, substacks: [] },
            { id: 7, name: 'Payment DB', type: 'Database', status: 'Active', description: 'Payment data', technology: 'PostgreSQL', responsibilities: 'Store transactions', connections: [], dependencies: [4], visible: true, locked: false, substacks: [] }
        ]
    },
    threeLayer: {
        name: 'Three-Tier Architecture',
        layers: [
            { id: 1, name: 'Web Frontend', type: 'Frontend', status: 'Active', description: 'User interface', technology: 'React', responsibilities: 'Display UI', connections: [2], dependencies: [], visible: true, locked: false, substacks: [] },
            { id: 2, name: 'Application Server', type: 'Backend', status: 'Active', description: 'Business logic', technology: 'Java Spring Boot', responsibilities: 'Process requests', connections: [3], dependencies: [1], visible: true, locked: false, substacks: [] },
            { id: 3, name: 'Database', type: 'Database', status: 'Active', description: 'Data storage', technology: 'MySQL', responsibilities: 'Persist data', connections: [], dependencies: [2], visible: true, locked: false, substacks: [] }
        ]
    },
    serverless: {
        name: 'Serverless Architecture',
        layers: [
            { id: 1, name: 'CloudFront CDN', type: 'Frontend', status: 'Active', description: 'Content delivery', technology: 'AWS CloudFront', responsibilities: 'Serve static assets', connections: [2], dependencies: [], visible: true, locked: false, substacks: [] },
            { id: 2, name: 'API Gateway', type: 'API', status: 'Active', description: 'API management', technology: 'AWS API Gateway', responsibilities: 'Route API calls', connections: [3, 4, 5], dependencies: [1], visible: true, locked: false, substacks: [] },
            { id: 3, name: 'Auth Lambda', type: 'Backend', status: 'Active', description: 'Authentication', technology: 'AWS Lambda', responsibilities: 'User auth', connections: [6], dependencies: [2], visible: true, locked: false, substacks: [] },
            { id: 4, name: 'Data Lambda', type: 'Backend', status: 'Active', description: 'Data processing', technology: 'AWS Lambda', responsibilities: 'CRUD operations', connections: [6], dependencies: [2], visible: true, locked: false, substacks: [] },
            { id: 5, name: 'File Lambda', type: 'Backend', status: 'Active', description: 'File handling', technology: 'AWS Lambda', responsibilities: 'File uploads', connections: [7], dependencies: [2], visible: true, locked: false, substacks: [] },
            { id: 6, name: 'DynamoDB', type: 'Database', status: 'Active', description: 'NoSQL database', technology: 'AWS DynamoDB', responsibilities: 'Store data', connections: [], dependencies: [3, 4], visible: true, locked: false, substacks: [] },
            { id: 7, name: 'S3 Storage', type: 'Database', status: 'Active', description: 'Object storage', technology: 'AWS S3', responsibilities: 'Store files', connections: [], dependencies: [5], visible: true, locked: false, substacks: [] }
        ]
    }
};

function loadTemplate(templateName) {
    if (TEMPLATES[templateName]) {
        project = JSON.parse(JSON.stringify(TEMPLATES[templateName]));
        document.getElementById('project-title').textContent = project.name;
        undoStack = [];
        redoStack = [];
        saveProject();
        renderLayers();
        updateStats();
        selectLayer(0);
        if (currentView === 'diagram') {
            renderDiagram();
        }
    }
}
