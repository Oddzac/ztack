let currentView = 'stack';
let canvas, ctx;
let draggedNode = null;
let nodePositions = {};
let zoomLevel = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let dragStartX = 0;
let dragStartY = 0;

function initDiagramView() {
    canvas = document.getElementById('diagram-canvas');
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    recalculateLayout();
    
    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseup', handleCanvasMouseUp);
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('wheel', handleCanvasWheel, { passive: false });
    
    window.addEventListener('resize', resizeCanvas);
    
    addZoomControls();
    renderDiagram();
}

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    if (ctx) renderDiagram();
}

function addZoomControls() {
    const container = document.getElementById('diagram-view');
    if (document.getElementById('zoom-controls')) return;
    
    const controls = document.createElement('div');
    controls.id = 'zoom-controls';
    controls.style.cssText = 'position: absolute; top: 20px; right: 20px; display: flex; flex-direction: column; gap: 8px; z-index: 100;';
    controls.innerHTML = `
        <button onclick="zoomIn()" style="background: #0f172a; border: 1px solid #334155; color: #e2e8f0; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 16px; transition: background 0.2s;" onmouseover="this.style.background='#1e293b'" onmouseout="this.style.background='#0f172a'">+</button>
        <button onclick="zoomReset()" style="background: #0f172a; border: 1px solid #334155; color: #e2e8f0; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; transition: background 0.2s;" onmouseover="this.style.background='#1e293b'" onmouseout="this.style.background='#0f172a'">100%</button>
        <button onclick="zoomOut()" style="background: #0f172a; border: 1px solid #334155; color: #e2e8f0; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 16px; transition: background 0.2s;" onmouseover="this.style.background='#1e293b'" onmouseout="this.style.background='#0f172a'">−</button>
        <button onclick="zoomToFit()" style="background: #0f172a; border: 1px solid #334155; color: #e2e8f0; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; transition: background 0.2s;" onmouseover="this.style.background='#1e293b'" onmouseout="this.style.background='#0f172a'">Fit</button>
    `;
    container.appendChild(controls);
}

function zoomIn() {
    zoomLevel = Math.min(zoomLevel * 1.2, 3);
    renderDiagram();
}

function zoomOut() {
    zoomLevel = Math.max(zoomLevel / 1.2, 0.3);
    renderDiagram();
}

function zoomReset() {
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    renderDiagram();
}

function zoomToFit() {
    const allLayers = getAllLayers();
    if (allLayers.length === 0) return;
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    allLayers.forEach(layer => {
        if (nodePositions[layer.id]) {
            minX = Math.min(minX, nodePositions[layer.id].x - 100);
            maxX = Math.max(maxX, nodePositions[layer.id].x + 100);
            minY = Math.min(minY, nodePositions[layer.id].y - 60);
            maxY = Math.max(maxY, nodePositions[layer.id].y + 60);
        }
    });
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const scaleX = (canvas.width * 0.9) / contentWidth;
    const scaleY = (canvas.height * 0.9) / contentHeight;
    
    zoomLevel = Math.min(scaleX, scaleY, 2);
    panX = (canvas.width / 2 - (minX + maxX) / 2 * zoomLevel);
    panY = (canvas.height / 2 - (minY + maxY) / 2 * zoomLevel);
    
    renderDiagram();
}

function handleCanvasWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.3, Math.min(3, zoomLevel * delta));
    
    // Zoom towards mouse position
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    panX = mouseX - (mouseX - panX) * (newZoom / zoomLevel);
    panY = mouseY - (mouseY - panY) * (newZoom / zoomLevel);
    
    zoomLevel = newZoom;
    renderDiagram();
}

function recalculateLayout() {
    nodePositions = {};
    
    // Build dependency graph and calculate levels (left to right flow)
    const levels = calculateLayerLevels();
    
    console.log('=== LAYOUT CALCULATION START ===');
    console.log('Layer levels:', levels);
    
    // Group layers by level
    const layersByLevel = {};
    project.layers.forEach(layer => {
        const level = levels[layer.id] || 0;
        if (!layersByLevel[level]) layersByLevel[level] = [];
        layersByLevel[level].push(layer);
    });
    
    // Layout parameters
    const baseX = 200;
    const baseY = 200;
    const levelSpacing = 700;
    const rowSpacing = 400;
    const maxPerLevel = 2;
    
    // Position layers level by level (left to right)
    Object.keys(layersByLevel).sort((a, b) => a - b).forEach(level => {
        const layersInLevel = layersByLevel[level];
        let row = 0;
        let col = 0;
        let currentY = baseY;
        let currentRowMaxHeight = 0;
        
        layersInLevel.forEach((layer, idx) => {
            const hasSubstacks = layer.substacks && layer.substacks.length > 0;
            const substackCount = hasSubstacks ? layer.substacks.length : 0;
            const layerHeight = hasSubstacks ? substackCount * 180 : 120;
            
            nodePositions[layer.id] = {
                x: baseX + (parseInt(level) * levelSpacing),
                y: currentY + (row * rowSpacing),
                level: parseInt(level),
                row: row
            };
            
            console.log(`Layer "${layer.name}" | Level: ${level}, Row: ${row} | Substacks: ${substackCount} | Position: (${nodePositions[layer.id].x}, ${nodePositions[layer.id].y})`);
            
            currentRowMaxHeight = Math.max(currentRowMaxHeight, layerHeight);
            
            col++;
            if (col >= maxPerLevel) {
                const extraSpacing = Math.max(0, currentRowMaxHeight - 200);
                currentY += rowSpacing + extraSpacing;
                col = 0;
                row++;
                currentRowMaxHeight = 0;
            }
        });
    });
    
    // Position substacks relative to parents
    project.layers.forEach(layer => {
        if (layer.substacks && layer.substacks.length > 0 && nodePositions[layer.id]) {
            const substackCount = layer.substacks.length;
            const substackSpacing = 180;
            
            console.log(`Positioning substacks for "${layer.name}":`);
            layer.substacks.forEach((sub, substackIndex) => {
                nodePositions[sub.id] = {
                    x: nodePositions[layer.id].x + 400,
                    y: nodePositions[layer.id].y + (substackIndex * substackSpacing) - ((substackCount - 1) * substackSpacing / 2)
                };
                console.log(`  - "${sub.name}": (${nodePositions[sub.id].x}, ${nodePositions[sub.id].y})`);
            });
        }
    });
    
    console.log('=== LAYOUT CALCULATION END ===');
}

function calculateLayerLevels() {
    const levels = {};
    const visited = new Set();
    const inProgress = new Set();
    
    // Build adjacency list from connections
    const graph = {};
    project.layers.forEach(layer => {
        graph[layer.id] = layer.connections || [];
    });
    
    // DFS to calculate levels (topological ordering)
    function dfs(layerId, currentLevel = 0) {
        if (inProgress.has(layerId)) return currentLevel; // Circular dependency
        if (visited.has(layerId)) return levels[layerId];
        
        inProgress.add(layerId);
        levels[layerId] = currentLevel;
        
        const connections = graph[layerId] || [];
        connections.forEach(targetId => {
            const targetLevel = dfs(targetId, currentLevel + 1);
            levels[targetId] = Math.max(levels[targetId] || 0, targetLevel);
        });
        
        inProgress.delete(layerId);
        visited.add(layerId);
        return levels[layerId];
    }
    
    // Start from layers with no incoming connections (roots)
    const hasIncoming = new Set();
    project.layers.forEach(layer => {
        (layer.connections || []).forEach(targetId => hasIncoming.add(targetId));
    });
    
    project.layers.forEach(layer => {
        if (!hasIncoming.has(layer.id)) {
            dfs(layer.id, 0);
        }
    });
    
    // Handle disconnected layers
    project.layers.forEach(layer => {
        if (levels[layer.id] === undefined) {
            levels[layer.id] = 0;
        }
    });
    
    return levels;
}

function renderDiagram() {
    if (!canvas || !ctx) return;
    
    // Recalculate substack positions in case new ones were added
    recalculateLayout();
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply zoom and pan
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoomLevel, zoomLevel);
    
    const allLayers = getAllLayers();
    
    // Draw substack grouping boxes first
    project.layers.forEach(layer => {
        if (layer.substacks && layer.substacks.length > 0 && nodePositions[layer.id]) {
            const parentPos = nodePositions[layer.id];
            let minX = parentPos.x, maxX = parentPos.x;
            let minY = parentPos.y, maxY = parentPos.y;
            
            layer.substacks.forEach(sub => {
                if (nodePositions[sub.id]) {
                    minX = Math.min(minX, nodePositions[sub.id].x);
                    maxX = Math.max(maxX, nodePositions[sub.id].x);
                    minY = Math.min(minY, nodePositions[sub.id].y);
                    maxY = Math.max(maxY, nodePositions[sub.id].y);
                }
            });
            
            const paddingVertical = 80;
            const paddingHorizontal = 120;
            ctx.strokeStyle = LAYER_TYPES[layer.type] || '#6b7280';
            ctx.setLineDash([8, 4]);
            ctx.lineWidth = 2;
            ctx.strokeRect(minX - paddingHorizontal, minY - paddingVertical, maxX - minX + paddingHorizontal * 2, maxY - minY + paddingVertical * 2);
            ctx.setLineDash([]);
            
            // Group label
            ctx.fillStyle = LAYER_TYPES[layer.type] || '#6b7280';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(`${layer.name} Group`, minX - paddingHorizontal + 10, minY - paddingVertical - 5);
        }
    });
    
    // Draw connections
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
    
    // Draw parent-to-substack connections
    project.layers.forEach(layer => {
        if (layer.substacks && layer.substacks.length > 0 && nodePositions[layer.id]) {
            layer.substacks.forEach(sub => {
                if (nodePositions[sub.id]) {
                    ctx.strokeStyle = LAYER_TYPES[layer.type] || '#6b7280';
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([3, 3]);
                    ctx.beginPath();
                    ctx.moveTo(nodePositions[layer.id].x, nodePositions[layer.id].y);
                    ctx.lineTo(nodePositions[sub.id].x, nodePositions[sub.id].y);
                    ctx.stroke();
                    ctx.setLineDash([]);
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
    
    ctx.restore();
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
    const x = (e.clientX - rect.left - panX) / zoomLevel;
    const y = (e.clientY - rect.top - panY) / zoomLevel;
    
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    const node = getNodeAtPosition(x, y);
    if (node) {
        draggedNode = node;
    } else {
        isPanning = true;
        panStartX = panX;
        panStartY = panY;
        canvas.style.cursor = 'grabbing';
    }
}

function handleCanvasMouseMove(e) {
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    const moved = Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3;
    
    if (isPanning) {
        panX = panStartX + (e.clientX - dragStartX);
        panY = panStartY + (e.clientY - dragStartY);
        renderDiagram();
    } else if (draggedNode && moved) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - panX) / zoomLevel;
        const y = (e.clientY - rect.top - panY) / zoomLevel;
        
        nodePositions[draggedNode.id] = { x, y };
        renderDiagram();
    }
}

function handleCanvasMouseUp() {
    draggedNode = null;
    isPanning = false;
    canvas.style.cursor = 'default';
}

function handleCanvasClick(e) {
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    const moved = Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3;
    
    if (moved) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - panX) / zoomLevel;
    const y = (e.clientY - rect.top - panY) / zoomLevel;
    
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
