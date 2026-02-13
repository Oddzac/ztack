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

// Connection type definitions
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

// Cost model configuration
const COST_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];
const COST_PERIODS = ['month', 'year', 'per-request', 'per-gb', 'per-hour'];

// Default cost model template
const DEFAULT_COST_MODEL = {
    currency: 'USD',
    period: 'month',
    fixedCost: 0,
    variableCost: 0,
    variableUnit: '',
    notes: ''
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
            connections: [{ targetId: 2, type: 'HTTP' }],
            dependencies: [],
            visible: true,
            locked: false,
            costModel: {
                currency: 'USD',
                period: 'month',
                fixedCost: 50,
                variableCost: 0,
                variableUnit: '',
                notes: 'CDN + hosting'
            },
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
                    locked: false,
                    costModel: {
                        currency: 'USD',
                        period: 'month',
                        fixedCost: 0,
                        variableCost: 0,
                        variableUnit: '',
                        notes: ''
                    }
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
                    locked: false,
                    costModel: {
                        currency: 'USD',
                        period: 'month',
                        fixedCost: 0,
                        variableCost: 0,
                        variableUnit: '',
                        notes: ''
                    }
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
            connections: [{ targetId: 3, type: 'HTTP' }],
            dependencies: [1],
            visible: true,
            locked: false,
            costModel: {
                currency: 'USD',
                period: 'month',
                fixedCost: 400,
                variableCost: 0.00002,
                variableUnit: 'per 1M requests',
                notes: 'Compute + bandwidth'
            },
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
            connections: [{ targetId: 4, type: 'Database' }],
            dependencies: [2],
            visible: true,
            locked: false,
            costModel: {
                currency: 'USD',
                period: 'month',
                fixedCost: 300,
                variableCost: 0,
                variableUnit: '',
                notes: 'Compute resources'
            },
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
            costModel: {
                currency: 'USD',
                period: 'month',
                fixedCost: 250,
                variableCost: 0.0001,
                variableUnit: 'per GB stored',
                notes: 'Instance + storage + I/O'
            },
            substacks: []
        }
    ]
};

// Template projects
const TEMPLATES = {
    microservices: {
        name: 'Microservices Architecture',
        layers: [
            { id: 1, name: 'API Gateway', type: 'API', status: 'Active', description: 'Entry point for all requests', technology: 'Kong/NGINX', responsibilities: 'Route, authenticate, rate limit', connections: [{ targetId: 2, type: 'HTTP' }, { targetId: 3, type: 'HTTP' }, { targetId: 4, type: 'HTTP' }], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 500, variableCost: 0.00001, variableUnit: 'per 1M requests', notes: 'Gateway infrastructure' }, substacks: [] },
            { id: 2, name: 'User Service', type: 'Backend', status: 'Active', description: 'User management', technology: 'Node.js', responsibilities: 'User CRUD operations', connections: [{ targetId: 5, type: 'Database' }], dependencies: [1], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 200, variableCost: 0, variableUnit: '', notes: 'Microservice compute' }, substacks: [] },
            { id: 3, name: 'Order Service', type: 'Backend', status: 'Active', description: 'Order processing', technology: 'Java Spring', responsibilities: 'Order management', connections: [{ targetId: 6, type: 'Database' }], dependencies: [1], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 250, variableCost: 0, variableUnit: '', notes: 'Microservice compute' }, substacks: [] },
            { id: 4, name: 'Payment Service', type: 'Backend', status: 'Active', description: 'Payment processing', technology: 'Python', responsibilities: 'Handle payments', connections: [{ targetId: 7, type: 'Database' }], dependencies: [1], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 300, variableCost: 0, variableUnit: '', notes: 'Microservice compute' }, substacks: [] },
            { id: 5, name: 'User DB', type: 'Database', status: 'Active', description: 'User data', technology: 'PostgreSQL', responsibilities: 'Store user data', connections: [], dependencies: [2], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 150, variableCost: 0.0001, variableUnit: 'per GB', notes: 'Database instance' }, substacks: [] },
            { id: 6, name: 'Order DB', type: 'Database', status: 'Active', description: 'Order data', technology: 'MongoDB', responsibilities: 'Store orders', connections: [], dependencies: [3], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 200, variableCost: 0.00005, variableUnit: 'per 1M ops', notes: 'NoSQL database' }, substacks: [] },
            { id: 7, name: 'Payment DB', type: 'Database', status: 'Active', description: 'Payment data', technology: 'PostgreSQL', responsibilities: 'Store transactions', connections: [], dependencies: [4], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 150, variableCost: 0.0001, variableUnit: 'per GB', notes: 'Database instance' }, substacks: [] }
        ]
    },
    threeLayer: {
        name: 'Three-Tier Architecture',
        layers: [
            { id: 1, name: 'Web Frontend', type: 'Frontend', status: 'Active', description: 'User interface', technology: 'React', responsibilities: 'Display UI', connections: [{ targetId: 2, type: 'HTTP' }], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 75, variableCost: 0, variableUnit: '', notes: 'CDN + hosting' }, substacks: [] },
            { id: 2, name: 'Application Server', type: 'Backend', status: 'Active', description: 'Business logic', technology: 'Java Spring Boot', responsibilities: 'Process requests', connections: [{ targetId: 3, type: 'Database' }], dependencies: [1], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 350, variableCost: 0, variableUnit: '', notes: 'Application server' }, substacks: [] },
            { id: 3, name: 'Database', type: 'Database', status: 'Active', description: 'Data storage', technology: 'MySQL', responsibilities: 'Persist data', connections: [], dependencies: [2], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 200, variableCost: 0.00008, variableUnit: 'per GB', notes: 'Database instance' }, substacks: [] }
        ]
    },
    serverless: {
        name: 'Serverless Architecture',
        layers: [
            { id: 1, name: 'CloudFront CDN', type: 'Frontend', status: 'Active', description: 'Content delivery', technology: 'AWS CloudFront', responsibilities: 'Serve static assets', connections: [{ targetId: 2, type: 'HTTP' }], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 0, variableCost: 0.085, variableUnit: 'per GB', notes: 'Pay-per-use CDN' }, substacks: [] },
            { id: 2, name: 'API Gateway', type: 'API', status: 'Active', description: 'API management', technology: 'AWS API Gateway', responsibilities: 'Route API calls', connections: [{ targetId: 3, type: 'HTTP' }, { targetId: 4, type: 'HTTP' }, { targetId: 5, type: 'HTTP' }], dependencies: [1], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 0, variableCost: 0.0000035, variableUnit: 'per request', notes: 'Serverless API' }, substacks: [] },
            { id: 3, name: 'Auth Lambda', type: 'Backend', status: 'Active', description: 'Authentication', technology: 'AWS Lambda', responsibilities: 'User auth', connections: [{ targetId: 6, type: 'Database' }], dependencies: [2], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 0, variableCost: 0.0000002, variableUnit: 'per GB-second', notes: 'Serverless compute' }, substacks: [] },
            { id: 4, name: 'Data Lambda', type: 'Backend', status: 'Active', description: 'Data processing', technology: 'AWS Lambda', responsibilities: 'CRUD operations', connections: [{ targetId: 6, type: 'Database' }], dependencies: [2], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 0, variableCost: 0.0000002, variableUnit: 'per GB-second', notes: 'Serverless compute' }, substacks: [] },
            { id: 5, name: 'File Lambda', type: 'Backend', status: 'Active', description: 'File handling', technology: 'AWS Lambda', responsibilities: 'File uploads', connections: [{ targetId: 7, type: 'Database' }], dependencies: [2], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 0, variableCost: 0.0000002, variableUnit: 'per GB-second', notes: 'Serverless compute' }, substacks: [] },
            { id: 6, name: 'DynamoDB', type: 'Database', status: 'Active', description: 'NoSQL database', technology: 'AWS DynamoDB', responsibilities: 'Store data', connections: [], dependencies: [3, 4], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 0, variableCost: 0.00000125, variableUnit: 'per read unit', notes: 'On-demand pricing' }, substacks: [] },
            { id: 7, name: 'S3 Storage', type: 'Database', status: 'Active', description: 'Object storage', technology: 'AWS S3', responsibilities: 'Store files', connections: [], dependencies: [5], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 0, variableCost: 0.023, variableUnit: 'per GB', notes: 'Object storage' }, substacks: [] }
        ]
    },
    enterprise: {
            name: 'Enterprise E-Commerce Platform',
            layers: [
                { id: 1, name: 'Web Application', type: 'Frontend', status: 'Active', description: 'Customer-facing web app', technology: 'Next.js 14, TypeScript', responsibilities: 'Product browsing, checkout, user account', connections: [{ targetId: 3, type: 'HTTP' }], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 80, variableCost: 0, variableUnit: '', notes: 'Framework and base hosting' }, substacks: [
                    { id: '1_1', name: 'Product Catalog UI', type: 'Frontend', status: 'Active', description: 'Product display components', technology: 'React Server Components', responsibilities: 'Product listings, search, filters', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 50, variableCost: 0.0001, variableUnit: 'per 1M page views', notes: 'CDN for product pages' } },
                    { id: '1_2', name: 'Shopping Cart', type: 'Frontend', status: 'Active', description: 'Cart management', technology: 'React Context', responsibilities: 'Add/remove items, calculate totals', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 30, variableCost: 0, variableUnit: '', notes: 'Client-side state management' } },
                    { id: '1_3', name: 'Checkout Flow', type: 'Frontend', status: 'Active', description: 'Payment and shipping', technology: 'React Hook Form', responsibilities: 'Address, payment, order confirmation', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 40, variableCost: 0, variableUnit: '', notes: 'Form validation and UI' } }
                ]},
                { id: 2, name: 'Mobile App', type: 'Frontend', status: 'Active', description: 'iOS and Android apps', technology: 'React Native', responsibilities: 'Mobile shopping experience', connections: [{ targetId: 3, type: 'HTTP' }], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 20, variableCost: 0, variableUnit: '', notes: 'App store distribution fees' }, substacks: [
                    { id: '2_1', name: 'Native Modules', type: 'Frontend', status: 'Active', description: 'Platform-specific features', technology: 'Swift, Kotlin', responsibilities: 'Camera, push notifications, biometrics', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 60, variableCost: 0, variableUnit: '', notes: 'Native development tools' } },
                    { id: '2_2', name: 'Offline Mode', type: 'Frontend', status: 'Active', description: 'Offline functionality', technology: 'AsyncStorage, SQLite', responsibilities: 'Cache products, sync cart', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 20, variableCost: 0, variableUnit: '', notes: 'Local storage management' } }
                ]},
                { id: 3, name: 'API Gateway', type: 'API', status: 'Active', description: 'Unified API entry point', technology: 'Kong Gateway', responsibilities: 'Authentication, rate limiting, routing', connections: [{ targetId: 4, type: 'gRPC' }, { targetId: 5, type: 'HTTP' }, { targetId: 6, type: 'HTTP' }, { targetId: 7, type: 'HTTP' }, { targetId: 8, type: 'HTTP' }], dependencies: [1, 2], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 200, variableCost: 0.00001, variableUnit: 'per 1M requests', notes: 'Kong gateway base cost' }, substacks: [
                    { id: '3_1', name: 'Auth Middleware', type: 'API', status: 'Active', description: 'JWT validation', technology: 'Kong JWT Plugin', responsibilities: 'Verify tokens, extract user claims', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 100, variableCost: 0, variableUnit: '', notes: 'Auth service' } },
                    { id: '3_2', name: 'Rate Limiter', type: 'API', status: 'Active', description: 'Request throttling', technology: 'Kong Rate Limiting', responsibilities: 'Prevent abuse, enforce quotas', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 50, variableCost: 0, variableUnit: '', notes: 'Rate limiting service' } },
                    { id: '3_3', name: 'Request Logger', type: 'API', status: 'Active', description: 'Audit logging', technology: 'Kong File Log', responsibilities: 'Log all API requests', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 75, variableCost: 0.00001, variableUnit: 'per 1M logs', notes: 'Logging infrastructure' } }
                ]},
                { id: 4, name: 'Product Service', type: 'Backend', status: 'Active', description: 'Product catalog management', technology: 'Go, gRPC', responsibilities: 'Product CRUD, search, inventory', connections: [{ targetId: 9, type: 'Database' }, { targetId: 11, type: 'Event' }], dependencies: [3], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 150, variableCost: 0, variableUnit: '', notes: 'Microservice base compute' }, substacks: [
                    { id: '4_1', name: 'Search Engine', type: 'Backend', status: 'Active', description: 'Full-text search', technology: 'Elasticsearch', responsibilities: 'Index products, fuzzy search', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 250, variableCost: 0.0001, variableUnit: 'per GB indexed', notes: 'Elasticsearch cluster' } },
                    { id: '4_2', name: 'Image Processor', type: 'Backend', status: 'Active', description: 'Image optimization', technology: 'Sharp, ImageMagick', responsibilities: 'Resize, compress, generate thumbnails', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 150, variableCost: 0.00001, variableUnit: 'per 1M images', notes: 'Image processing compute' } },
                    { id: '4_3', name: 'Inventory Tracker', type: 'Backend', status: 'Active', description: 'Stock management', technology: 'Redis', responsibilities: 'Real-time stock levels', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 200, variableCost: 0, variableUnit: '', notes: 'Redis cache cluster' } }
                ]},
                { id: 5, name: 'Order Service', type: 'Backend', status: 'Active', description: 'Order processing', technology: 'Java Spring Boot', responsibilities: 'Order creation, status tracking', connections: [{ targetId: 6, type: 'Async' }, { targetId: 10, type: 'Database' }, { targetId: 11, type: 'Event' }], dependencies: [3], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 200, variableCost: 0, variableUnit: '', notes: 'Microservice base compute' }, substacks: [
                    { id: '5_1', name: 'Order Validator', type: 'Backend', status: 'Active', description: 'Validation logic', technology: 'Spring Validation', responsibilities: 'Validate order data, check inventory', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 100, variableCost: 0, variableUnit: '', notes: 'Validation service' } },
                    { id: '5_2', name: 'Order State Machine', type: 'Backend', status: 'Active', description: 'Order workflow', technology: 'Spring State Machine', responsibilities: 'Manage order lifecycle', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 150, variableCost: 0, variableUnit: '', notes: 'Workflow engine' } },
                    { id: '5_3', name: 'Notification Publisher', type: 'Backend', status: 'Active', description: 'Event publishing', technology: 'Kafka Producer', responsibilities: 'Publish order events', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 80, variableCost: 0, variableUnit: '', notes: 'Event publishing' } }
                ]},
                { id: 6, name: 'Payment Service', type: 'Backend', status: 'Active', description: 'Payment processing', technology: 'Python FastAPI', responsibilities: 'Process payments, refunds', connections: [{ targetId: 10, type: 'Database' }, { targetId: 11, type: 'Event' }], dependencies: [3, 5], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 100, variableCost: 0, variableUnit: '', notes: 'Microservice base compute' }, substacks: [
                    { id: '6_1', name: 'Stripe Integration', type: 'Backend', status: 'Active', description: 'Credit card processing', technology: 'Stripe SDK', responsibilities: 'Charge cards, handle webhooks', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 0, variableCost: 0, variableUnit: '', notes: '' } },
                    { id: '6_2', name: 'PayPal Integration', type: 'Backend', status: 'Active', description: 'PayPal payments', technology: 'PayPal SDK', responsibilities: 'Process PayPal transactions', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 0, variableCost: 0, variableUnit: '', notes: '' } },
                    { id: '6_3', name: 'Fraud Detection', type: 'Backend', status: 'Active', description: 'Fraud prevention', technology: 'Scikit-learn', responsibilities: 'Score transactions, flag suspicious', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 0, variableCost: 0, variableUnit: '', notes: '' } }
                ]},
                { id: 7, name: 'User Service', type: 'Backend', status: 'Active', description: 'User management', technology: 'Node.js Express', responsibilities: 'User accounts, authentication', connections: [{ targetId: 10, type: 'Database' }], dependencies: [3], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 100, variableCost: 0, variableUnit: '', notes: 'Microservice base compute' }, substacks: [
                    { id: '7_1', name: 'Auth Handler', type: 'Backend', status: 'Active', description: 'Login/signup', technology: 'Passport.js', responsibilities: 'Email/password, OAuth', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 80, variableCost: 0, variableUnit: '', notes: 'Auth service' } },
                    { id: '7_2', name: 'Profile Manager', type: 'Backend', status: 'Active', description: 'User profiles', technology: 'Express', responsibilities: 'Update profile, preferences', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 60, variableCost: 0, variableUnit: '', notes: 'Profile service' } },
                    { id: '7_3', name: 'Session Store', type: 'Backend', status: 'Active', description: 'Session management', technology: 'Redis', responsibilities: 'Store active sessions', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 120, variableCost: 0, variableUnit: '', notes: 'Redis session cache' } }
                ]},
                { id: 8, name: 'Notification Service', type: 'Backend', status: 'Active', description: 'Multi-channel notifications', technology: 'Node.js', responsibilities: 'Email, SMS, push notifications', connections: [{ targetId: 11, type: 'Message' }], dependencies: [3], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 80, variableCost: 0, variableUnit: '', notes: 'Microservice base compute' }, substacks: [
                    { id: '8_1', name: 'Email Sender', type: 'Backend', status: 'Active', description: 'Email delivery', technology: 'SendGrid', responsibilities: 'Transactional emails', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 50, variableCost: 0.00001, variableUnit: 'per 1M emails', notes: 'SendGrid service' } },
                    { id: '8_2', name: 'SMS Sender', type: 'Backend', status: 'Active', description: 'SMS delivery', technology: 'Twilio', responsibilities: 'Order updates via SMS', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 30, variableCost: 0.0075, variableUnit: 'per SMS', notes: 'Twilio SMS service' } },
                    { id: '8_3', name: 'Push Sender', type: 'Backend', status: 'Active', description: 'Push notifications', technology: 'Firebase Cloud Messaging', responsibilities: 'Mobile push notifications', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 40, variableCost: 0, variableUnit: '', notes: 'Firebase service' } }
                ]},
                { id: 9, name: 'Product Database', type: 'Database', status: 'Active', description: 'Product catalog storage', technology: 'PostgreSQL 15', responsibilities: 'Store product data, categories', connections: [], dependencies: [4], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 400, variableCost: 0.0001, variableUnit: 'per GB', notes: 'Database instance' }, substacks: [] },
                { id: 10, name: 'Order Database', type: 'Database', status: 'Active', description: 'Order and user data', technology: 'MongoDB', responsibilities: 'Store orders, users, sessions', connections: [], dependencies: [5, 6, 7], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 500, variableCost: 0.00005, variableUnit: 'per 1M ops', notes: 'NoSQL database' }, substacks: [] },
                { id: 11, name: 'Message Queue', type: 'DevOps', status: 'Active', description: 'Event streaming', technology: 'Apache Kafka', responsibilities: 'Async communication between services', connections: [], dependencies: [4, 5, 6, 8], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 600, variableCost: 0, variableUnit: '', notes: 'Kafka cluster' }, substacks: [
                    { id: '11_1', name: 'Order Events Topic', type: 'DevOps', status: 'Active', description: 'Order event stream', technology: 'Kafka Topic', responsibilities: 'Order created, updated, shipped', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 100, variableCost: 0, variableUnit: '', notes: 'Topic storage' } },
                    { id: '11_2', name: 'Payment Events Topic', type: 'DevOps', status: 'Active', description: 'Payment event stream', technology: 'Kafka Topic', responsibilities: 'Payment success, failure, refund', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 80, variableCost: 0, variableUnit: '', notes: 'Topic storage' } },
                    { id: '11_3', name: 'Notification Queue', type: 'DevOps', status: 'Active', description: 'Notification queue', technology: 'Kafka Topic', responsibilities: 'Queue notifications for delivery', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 60, variableCost: 0, variableUnit: '', notes: 'Topic storage' } }
                ]},
                { id: 12, name: 'Infrastructure', type: 'DevOps', status: 'Active', description: 'Cloud infrastructure', technology: 'AWS, Terraform', responsibilities: 'Provision and manage cloud resources', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 1000, variableCost: 0, variableUnit: '', notes: 'Infrastructure overhead' }, substacks: [
                    { id: '12_1', name: 'Container Orchestration', type: 'DevOps', status: 'Active', description: 'Kubernetes cluster', technology: 'AWS EKS', responsibilities: 'Deploy and scale containers', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 300, variableCost: 0, variableUnit: '', notes: 'EKS cluster' } },
                    { id: '12_2', name: 'Load Balancer', type: 'DevOps', status: 'Active', description: 'Traffic distribution', technology: 'AWS ALB', responsibilities: 'Distribute traffic, SSL termination', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 150, variableCost: 0.006, variableUnit: 'per 1M requests', notes: 'Application Load Balancer' } },
                    { id: '12_3', name: 'Monitoring', type: 'DevOps', status: 'Active', description: 'Observability stack', technology: 'Prometheus, Grafana', responsibilities: 'Metrics, logs, alerts', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 200, variableCost: 0, variableUnit: '', notes: 'Monitoring infrastructure' } },
                    { id: '12_4', name: 'CI/CD Pipeline', type: 'DevOps', status: 'Active', description: 'Automated deployment', technology: 'GitHub Actions', responsibilities: 'Build, test, deploy', connections: [], dependencies: [], visible: true, locked: false, costModel: { currency: 'USD', period: 'month', fixedCost: 100, variableCost: 0, variableUnit: '', notes: 'CI/CD service' } }
                ]}
            ]
        }};

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
