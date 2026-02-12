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
                    id: '1_1',
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
                    id: '1_2',
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
    },
    enterprise: {
        name: 'Enterprise E-Commerce Platform',
        layers: [
            { id: 1, name: 'Web Application', type: 'Frontend', status: 'Active', description: 'Customer-facing web app', technology: 'Next.js 14, TypeScript', responsibilities: 'Product browsing, checkout, user account', connections: [2, 3], dependencies: [], visible: true, locked: false, substacks: [
                { id: '1_1', name: 'Product Catalog UI', type: 'Frontend', status: 'Active', description: 'Product display components', technology: 'React Server Components', responsibilities: 'Product listings, search, filters', connections: [], dependencies: [], visible: true, locked: false },
                { id: '1_2', name: 'Shopping Cart', type: 'Frontend', status: 'Active', description: 'Cart management', technology: 'React Context', responsibilities: 'Add/remove items, calculate totals', connections: [], dependencies: [], visible: true, locked: false },
                { id: '1_3', name: 'Checkout Flow', type: 'Frontend', status: 'Active', description: 'Payment and shipping', technology: 'React Hook Form', responsibilities: 'Address, payment, order confirmation', connections: [], dependencies: [], visible: true, locked: false }
            ]},
            { id: 2, name: 'Mobile App', type: 'Frontend', status: 'Active', description: 'iOS and Android apps', technology: 'React Native', responsibilities: 'Mobile shopping experience', connections: [3], dependencies: [], visible: true, locked: false, substacks: [
                { id: '2_1', name: 'Native Modules', type: 'Frontend', status: 'Active', description: 'Platform-specific features', technology: 'Swift, Kotlin', responsibilities: 'Camera, push notifications, biometrics', connections: [], dependencies: [], visible: true, locked: false },
                { id: '2_2', name: 'Offline Mode', type: 'Frontend', status: 'Active', description: 'Offline functionality', technology: 'AsyncStorage, SQLite', responsibilities: 'Cache products, sync cart', connections: [], dependencies: [], visible: true, locked: false }
            ]},
            { id: 3, name: 'API Gateway', type: 'API', status: 'Active', description: 'Unified API entry point', technology: 'Kong Gateway', responsibilities: 'Authentication, rate limiting, routing', connections: [4, 5, 6, 7, 8], dependencies: [1, 2], visible: true, locked: false, substacks: [
                { id: '3_1', name: 'Auth Middleware', type: 'API', status: 'Active', description: 'JWT validation', technology: 'Kong JWT Plugin', responsibilities: 'Verify tokens, extract user claims', connections: [], dependencies: [], visible: true, locked: false },
                { id: '3_2', name: 'Rate Limiter', type: 'API', status: 'Active', description: 'Request throttling', technology: 'Kong Rate Limiting', responsibilities: 'Prevent abuse, enforce quotas', connections: [], dependencies: [], visible: true, locked: false },
                { id: '3_3', name: 'Request Logger', type: 'API', status: 'Active', description: 'Audit logging', technology: 'Kong File Log', responsibilities: 'Log all API requests', connections: [], dependencies: [], visible: true, locked: false }
            ]},
            { id: 4, name: 'Product Service', type: 'Backend', status: 'Active', description: 'Product catalog management', technology: 'Go, gRPC', responsibilities: 'Product CRUD, search, inventory', connections: [9, 11], dependencies: [3], visible: true, locked: false, substacks: [
                { id: '4_1', name: 'Search Engine', type: 'Backend', status: 'Active', description: 'Full-text search', technology: 'Elasticsearch', responsibilities: 'Index products, fuzzy search', connections: [], dependencies: [], visible: true, locked: false },
                { id: '4_2', name: 'Image Processor', type: 'Backend', status: 'Active', description: 'Image optimization', technology: 'Sharp, ImageMagick', responsibilities: 'Resize, compress, generate thumbnails', connections: [], dependencies: [], visible: true, locked: false },
                { id: '4_3', name: 'Inventory Tracker', type: 'Backend', status: 'Active', description: 'Stock management', technology: 'Redis', responsibilities: 'Real-time stock levels', connections: [], dependencies: [], visible: true, locked: false }
            ]},
            { id: 5, name: 'Order Service', type: 'Backend', status: 'Active', description: 'Order processing', technology: 'Java Spring Boot', responsibilities: 'Order creation, status tracking', connections: [6, 7, 10], dependencies: [3], visible: true, locked: false, substacks: [
                { id: '5_1', name: 'Order Validator', type: 'Backend', status: 'Active', description: 'Validation logic', technology: 'Spring Validation', responsibilities: 'Validate order data, check inventory', connections: [], dependencies: [], visible: true, locked: false },
                { id: '5_2', name: 'Order State Machine', type: 'Backend', status: 'Active', description: 'Order workflow', technology: 'Spring State Machine', responsibilities: 'Manage order lifecycle', connections: [], dependencies: [], visible: true, locked: false },
                { id: '5_3', name: 'Notification Publisher', type: 'Backend', status: 'Active', description: 'Event publishing', technology: 'Kafka Producer', responsibilities: 'Publish order events', connections: [], dependencies: [], visible: true, locked: false }
            ]},
            { id: 6, name: 'Payment Service', type: 'Backend', status: 'Active', description: 'Payment processing', technology: 'Python FastAPI', responsibilities: 'Process payments, refunds', connections: [10, 11], dependencies: [3, 5], visible: true, locked: false, substacks: [
                { id: '6_1', name: 'Stripe Integration', type: 'Backend', status: 'Active', description: 'Credit card processing', technology: 'Stripe SDK', responsibilities: 'Charge cards, handle webhooks', connections: [], dependencies: [], visible: true, locked: false },
                { id: '6_2', name: 'PayPal Integration', type: 'Backend', status: 'Active', description: 'PayPal payments', technology: 'PayPal SDK', responsibilities: 'Process PayPal transactions', connections: [], dependencies: [], visible: true, locked: false },
                { id: '6_3', name: 'Fraud Detection', type: 'Backend', status: 'Active', description: 'Fraud prevention', technology: 'Scikit-learn', responsibilities: 'Score transactions, flag suspicious', connections: [], dependencies: [], visible: true, locked: false }
            ]},
            { id: 7, name: 'User Service', type: 'Backend', status: 'Active', description: 'User management', technology: 'Node.js Express', responsibilities: 'User accounts, authentication', connections: [10], dependencies: [3, 5], visible: true, locked: false, substacks: [
                { id: '7_1', name: 'Auth Handler', type: 'Backend', status: 'Active', description: 'Login/signup', technology: 'Passport.js', responsibilities: 'Email/password, OAuth', connections: [], dependencies: [], visible: true, locked: false },
                { id: '7_2', name: 'Profile Manager', type: 'Backend', status: 'Active', description: 'User profiles', technology: 'Express', responsibilities: 'Update profile, preferences', connections: [], dependencies: [], visible: true, locked: false },
                { id: '7_3', name: 'Session Store', type: 'Backend', status: 'Active', description: 'Session management', technology: 'Redis', responsibilities: 'Store active sessions', connections: [], dependencies: [], visible: true, locked: false }
            ]},
            { id: 8, name: 'Notification Service', type: 'Backend', status: 'Active', description: 'Multi-channel notifications', technology: 'Node.js', responsibilities: 'Email, SMS, push notifications', connections: [11], dependencies: [3], visible: true, locked: false, substacks: [
                { id: '8_1', name: 'Email Sender', type: 'Backend', status: 'Active', description: 'Email delivery', technology: 'SendGrid', responsibilities: 'Transactional emails', connections: [], dependencies: [], visible: true, locked: false },
                { id: '8_2', name: 'SMS Sender', type: 'Backend', status: 'Active', description: 'SMS delivery', technology: 'Twilio', responsibilities: 'Order updates via SMS', connections: [], dependencies: [], visible: true, locked: false },
                { id: '8_3', name: 'Push Sender', type: 'Backend', status: 'Active', description: 'Push notifications', technology: 'Firebase Cloud Messaging', responsibilities: 'Mobile push notifications', connections: [], dependencies: [], visible: true, locked: false }
            ]},
            { id: 9, name: 'Product Database', type: 'Database', status: 'Active', description: 'Product catalog storage', technology: 'PostgreSQL 15', responsibilities: 'Store product data, categories', connections: [], dependencies: [4], visible: true, locked: false, substacks: [] },
            { id: 10, name: 'Order Database', type: 'Database', status: 'Active', description: 'Order and user data', technology: 'MongoDB', responsibilities: 'Store orders, users, sessions', connections: [], dependencies: [5, 6, 7], visible: true, locked: false, substacks: [] },
            { id: 11, name: 'Message Queue', type: 'DevOps', status: 'Active', description: 'Event streaming', technology: 'Apache Kafka', responsibilities: 'Async communication between services', connections: [], dependencies: [4, 6, 8], visible: true, locked: false, substacks: [
                { id: '11_1', name: 'Order Events Topic', type: 'DevOps', status: 'Active', description: 'Order event stream', technology: 'Kafka Topic', responsibilities: 'Order created, updated, shipped', connections: [], dependencies: [], visible: true, locked: false },
                { id: '11_2', name: 'Payment Events Topic', type: 'DevOps', status: 'Active', description: 'Payment event stream', technology: 'Kafka Topic', responsibilities: 'Payment success, failure, refund', connections: [], dependencies: [], visible: true, locked: false },
                { id: '11_3', name: 'Notification Queue', type: 'DevOps', status: 'Active', description: 'Notification queue', technology: 'Kafka Topic', responsibilities: 'Queue notifications for delivery', connections: [], dependencies: [], visible: true, locked: false }
            ]},
            { id: 12, name: 'Infrastructure', type: 'DevOps', status: 'Active', description: 'Cloud infrastructure', technology: 'AWS, Terraform', responsibilities: 'Provision and manage cloud resources', connections: [], dependencies: [], visible: true, locked: false, substacks: [
                { id: '12_1', name: 'Container Orchestration', type: 'DevOps', status: 'Active', description: 'Kubernetes cluster', technology: 'AWS EKS', responsibilities: 'Deploy and scale containers', connections: [], dependencies: [], visible: true, locked: false },
                { id: '12_2', name: 'Load Balancer', type: 'DevOps', status: 'Active', description: 'Traffic distribution', technology: 'AWS ALB', responsibilities: 'Distribute traffic, SSL termination', connections: [], dependencies: [], visible: true, locked: false },
                { id: '12_3', name: 'Monitoring', type: 'DevOps', status: 'Active', description: 'Observability stack', technology: 'Prometheus, Grafana', responsibilities: 'Metrics, logs, alerts', connections: [], dependencies: [], visible: true, locked: false },
                { id: '12_4', name: 'CI/CD Pipeline', type: 'DevOps', status: 'Active', description: 'Automated deployment', technology: 'GitHub Actions', responsibilities: 'Build, test, deploy', connections: [], dependencies: [], visible: true, locked: false }
            ]}
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
