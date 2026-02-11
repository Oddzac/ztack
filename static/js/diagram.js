let currentView = 'stack';
let canvas, ctx;
let draggedNode = null;
let nodePositions = {};

function initDiagramView() {
    canvas = document.getElementById('diagram-canvas');
    ctx = canvas.getContext('2d');
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Initialize positions if not set
    const allLayers = getAllLayers();
    allLayers.forEach((layer, index) => {
        if (!nodePositions[layer.id]) {
            nodePositions[layer.id] = {
                x: 150 + (index % 3) * 250,
                y: 100 + Math.floor(index / 3) * 150
            };
        }
    });
    
    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseup', handleCanvasMouseUp);
    canvas.addEventListener('click', handleCanvasClick);
    
    renderDiagram();
}

function renderDiagram() {
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const allLayers = getAllLayers();
    
    // Draw connections first (behind nodes)
    allLayers.forEach(layer => {
        if (layer.connections) {
            layer.connections.forEach(targetId => {
                const target = allLayers.find(l => l.id === targetId);
                if (target && nodePositions[layer.id] && nodePositions[targetId]) {
                    drawConnection(
                        nodePositions[layer.id].x,
                        nodePositions[layer.id].y,
                        nodePositions[targetId].x,
                        nodePositions[targetId].y
                    );
                }
            });
        }
    });
    
    // Draw nodes
    allLayers.forEach(layer => {
        if (nodePositions[layer.id]) {
            const isSelected = (!inSubstack && project.layers[selectedLayerIndex]?.id === layer.id) ||
                             (inSubstack && project.layers[selectedLayerIndex].substacks[selectedSubstackIndex]?.id === layer.id);
            drawNode(layer, nodePositions[layer.id].x, nodePositions[layer.id].y, isSelected);
        }
    });
}

function drawNode(layer, x, y, isSelected) {
    const width = 200;
    const height = 120;
    
    // C4 styling based on type
    const c4Styles = {
        'Frontend': { shape: 'rect', color: '#10b981', icon: '🖥️' },
        'Backend': { shape: 'rect', color: '#f59e0b', icon: '⚙️' },
        'API': { shape: 'hexagon', color: '#06b6d4', icon: '🔌' },
        'Database': { shape: 'cylinder', color: '#8b5cf6', icon: '💾' },
        'DevOps': { shape: 'cloud', color: '#ef4444', icon: '☁️' },
        'Core': { shape: 'rect', color: '#3b82f6', icon: '🎯' },
        'Other': { shape: 'rect', color: '#6b7280', icon: '📦' }
    };
    
    const style = c4Styles[layer.type] || c4Styles['Other'];
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Draw shape based on type
    if (style.shape === 'cylinder') {
        drawCylinder(x, y, width, height, isSelected, style.color);
    } else if (style.shape === 'hexagon') {
        drawHexagon(x, y, width, height, isSelected, style.color);
    } else if (style.shape === 'cloud') {
        drawCloud(x, y, width, height, isSelected, style.color);
    } else {
        drawRect(x, y, width, height, isSelected, style.color);
    }
    
    ctx.shadowColor = 'transparent';
    
    // Icon
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(style.icon, x, y - 30);
    
    // Text
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(layer.name, x, y);
    
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(layer.type, x, y + 18);
    
    if (layer.technology) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(layer.technology.substring(0, 30), x, y + 35);
    }
}

function drawRect(x, y, width, height, isSelected, color) {
    ctx.fillStyle = isSelected ? '#334155' : '#1e293b';
    ctx.fillRect(x - width/2, y - height/2, width, height);
    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.strokeRect(x - width/2, y - height/2, width, height);
}

function drawCylinder(x, y, width, height, isSelected, color) {
    const ellipseHeight = 20;
    ctx.fillStyle = isSelected ? '#334155' : '#1e293b';
    
    // Main body
    ctx.fillRect(x - width/2, y - height/2 + ellipseHeight/2, width, height - ellipseHeight);
    
    // Top ellipse
    ctx.beginPath();
    ctx.ellipse(x, y - height/2 + ellipseHeight/2, width/2, ellipseHeight/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Bottom ellipse
    ctx.beginPath();
    ctx.ellipse(x, y + height/2 - ellipseHeight/2, width/2, ellipseHeight/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Borders
    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.ellipse(x, y - height/2 + ellipseHeight/2, width/2, ellipseHeight/2, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x - width/2, y - height/2 + ellipseHeight/2);
    ctx.lineTo(x - width/2, y + height/2 - ellipseHeight/2);
    ctx.moveTo(x + width/2, y - height/2 + ellipseHeight/2);
    ctx.lineTo(x + width/2, y + height/2 - ellipseHeight/2);
    ctx.stroke();
}

function drawHexagon(x, y, width, height, isSelected, color) {
    const offset = width * 0.15;
    ctx.fillStyle = isSelected ? '#334155' : '#1e293b';
    ctx.beginPath();
    ctx.moveTo(x - width/2 + offset, y - height/2);
    ctx.lineTo(x + width/2 - offset, y - height/2);
    ctx.lineTo(x + width/2, y);
    ctx.lineTo(x + width/2 - offset, y + height/2);
    ctx.lineTo(x - width/2 + offset, y + height/2);
    ctx.lineTo(x - width/2, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.stroke();
}

function drawCloud(x, y, width, height, isSelected, color) {
    ctx.fillStyle = isSelected ? '#334155' : '#1e293b';
    ctx.beginPath();
    ctx.arc(x - width/4, y, height/3, 0, Math.PI * 2);
    ctx.arc(x, y - height/4, height/2.5, 0, Math.PI * 2);
    ctx.arc(x + width/4, y, height/3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.stroke();
}

function drawConnection(x1, y1, x2, y2) {
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // Draw arrow
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Arrow head
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLength = 10;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
        x2 - headLength * Math.cos(angle - Math.PI / 6),
        y2 - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(x2, y2);
    ctx.lineTo(
        x2 - headLength * Math.cos(angle + Math.PI / 6),
        y2 - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
    
    ctx.setLineDash([]);
}

function getNodeAtPosition(x, y) {
    const allLayers = getAllLayers();
    for (let layer of allLayers) {
        const pos = nodePositions[layer.id];
        if (pos && Math.abs(x - pos.x) < 100 && Math.abs(y - pos.y) < 60) {
            return layer;
        }
    }
    return null;
}

function handleCanvasMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    draggedNode = getNodeAtPosition(x, y);
}

function handleCanvasMouseMove(e) {
    if (draggedNode) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        nodePositions[draggedNode.id] = { x, y };
        renderDiagram();
    }
}

function handleCanvasMouseUp() {
    draggedNode = null;
}

function handleCanvasClick(e) {
    if (draggedNode) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clickedNode = getNodeAtPosition(x, y);
    if (clickedNode) {
        // Find and select this layer
        const mainIndex = project.layers.findIndex(l => l.id === clickedNode.id);
        if (mainIndex !== -1) {
            selectedLayerIndex = mainIndex;
            inSubstack = false;
            renderDiagram();
            renderLayerDetails(clickedNode);
        } else {
            // Check substacks
            project.layers.forEach((layer, layerIdx) => {
                if (layer.substacks) {
                    const subIdx = layer.substacks.findIndex(s => s.id === clickedNode.id);
                    if (subIdx !== -1) {
                        selectedLayerIndex = layerIdx;
                        selectedSubstackIndex = subIdx;
                        inSubstack = true;
                        renderDiagram();
                        renderLayerDetails(clickedNode);
                    }
                }
            });
        }
    }
}

function toggleView(view) {
    currentView = view;
    
    if (view === 'stack') {
        document.getElementById('stack-view').style.display = 'flex';
        document.getElementById('diagram-view').style.display = 'none';
        renderLayers();
        selectLayer(selectedLayerIndex);
    } else {
        document.getElementById('stack-view').style.display = 'none';
        document.getElementById('diagram-view').style.display = 'flex';
        setTimeout(() => initDiagramView(), 50);
    }
}
