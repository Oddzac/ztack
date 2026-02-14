let canvas, ctx;
let nodePositions = {};
let zoomLevel = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let lastX = 0;
let lastY = 0;
let touchDistance = 0;
let connections = []; // Store connection metadata for hover detection
let hoveredConnection = null; // Track currently hovered connection
let connectionTooltip = null; // Tooltip element
let hoveredNodeId = null; // Track currently hovered node

function initDiagramView() {
    canvas = document.getElementById('diagram-canvas');
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    recalculateLayout();
    
    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseup', handleCanvasMouseUp);
    canvas.addEventListener('mouseleave', handleCanvasMouseLeave);
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('wheel', handleCanvasWheel, { passive: false });
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    
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
    const nodeWidth = 200;
    const nodeHeight = 120;
    const minVerticalSpacing = 200; // Minimum space between node centers
    const minHorizontalSpacing = 250; // Minimum space between nodes horizontally
    
    // Track occupied regions for collision detection
    const occupiedRegions = [];
    
    function checkCollision(x, y, width = nodeWidth, height = nodeHeight) {
        const padding = 20;
        const rect = {
            left: x - width / 2 - padding,
            right: x + width / 2 + padding,
            top: y - height / 2 - padding,
            bottom: y + height / 2 + padding
        };
        
        return occupiedRegions.some(occupied => {
            return !(rect.right < occupied.left || 
                     rect.left > occupied.right || 
                     rect.bottom < occupied.top || 
                     rect.top > occupied.bottom);
        });
    }
    
    function findNonCollidingPosition(baseX, baseY, width = nodeWidth, height = nodeHeight) {
        let x = baseX;
        let y = baseY;
        let attempts = 0;
        const maxAttempts = 50;
        
        while (checkCollision(x, y, width, height) && attempts < maxAttempts) {
            // Try shifting down first (preferred for visual flow)
            y += minVerticalSpacing;
            attempts++;
            
            // If we've shifted too far down, try shifting right
            if (attempts > 10) {
                x += minHorizontalSpacing;
                y = baseY;
                attempts = 0;
            }
        }
        
        return { x, y };
    }
    
    function recordOccupiedRegion(x, y, width = nodeWidth, height = nodeHeight) {
        const padding = 20;
        occupiedRegions.push({
            left: x - width / 2 - padding,
            right: x + width / 2 + padding,
            top: y - height / 2 - padding,
            bottom: y + height / 2 + padding
        });
    }
    
    // Position layers level by level (left to right)
    Object.keys(layersByLevel).sort((a, b) => a - b).forEach(level => {
        const layersInLevel = layersByLevel[level];
        let currentY = baseY;
        
        layersInLevel.forEach((layer, idx) => {
            const hasSubstacks = layer.substacks && layer.substacks.length > 0;
            const substackCount = hasSubstacks ? layer.substacks.length : 0;
            const layerHeight = hasSubstacks ? substackCount * 180 : 120;
            
            const basePosition = {
                x: baseX + (parseInt(level) * levelSpacing),
                y: currentY
            };
            
            // Check for collisions and adjust if needed
            const finalPosition = findNonCollidingPosition(basePosition.x, basePosition.y, nodeWidth, layerHeight);
            
            nodePositions[layer.id] = {
                x: finalPosition.x,
                y: finalPosition.y,
                level: parseInt(level),
                row: idx
            };
            
            recordOccupiedRegion(finalPosition.x, finalPosition.y, nodeWidth, layerHeight);
            
            console.log(`Layer "${layer.name}" | Level: ${level}, Row: ${idx} | Substacks: ${substackCount} | Position: (${finalPosition.x}, ${finalPosition.y})`);
            
            // Move baseline for next layer in this level
            currentY = finalPosition.y + layerHeight + minVerticalSpacing;
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
    
    // Build adjacency list from connections (both layer and substack)
    const graph = {};
    const allLayers = getAllLayers();
    
    allLayers.forEach(layer => {
        graph[layer.id] = (layer.connections || []).map(c => 
            typeof c === 'object' ? c.targetId : c
        );
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
    allLayers.forEach(layer => {
        const connections = (layer.connections || []).map(c => 
            typeof c === 'object' ? c.targetId : c
        );
        connections.forEach(targetId => hasIncoming.add(targetId));
    });
    
    allLayers.forEach(layer => {
        if (!hasIncoming.has(layer.id)) {
            dfs(layer.id, 0);
        }
    });
    
    // Handle disconnected layers
    allLayers.forEach(layer => {
        if (levels[layer.id] === undefined) {
            levels[layer.id] = 0;
        }
    });
    
    return levels;
}

function renderDiagram() {
    renderDiagramWithHover();
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

function drawConnection(x1, y1, x2, y2, isSubstackConnection = false, connectionType = 'HTTP', isHovered = false, isFaded = false) {
    // Get connection type styling
    const typeStyle = CONNECTION_TYPES[connectionType] || CONNECTION_TYPES['HTTP'];
    
    // Adjust styling for substack connections (lighter/thinner)
    let color = typeStyle.color;
    let lineWidth = typeStyle.width;
    let pattern = typeStyle.pattern;
    let opacity = 1;
    
    if (isSubstackConnection) {
        // Make substack connections slightly lighter
        color = typeStyle.color.replace(')', ', 0.7)').replace('rgb', 'rgba');
        lineWidth = Math.max(1, typeStyle.width - 0.5);
    }
    
    // Fade non-hovered connections when node is hovered
    if (isFaded) {
        opacity = 0.2;
    }
    
    // Highlight on hover
    if (isHovered) {
        lineWidth += 1.5;
        opacity = 1;
        color = typeStyle.color.replace(')', ', 1)').replace('rgba', 'rgb');
    }
    
    // Apply opacity to color
    if (opacity < 1) {
        // Convert hex to rgba with opacity
        if (color.startsWith('#')) {
            const hex = color.substring(1);
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            color = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        } else if (color.startsWith('rgb')) {
            color = color.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
        }
    }
    
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(pattern);
    
    // Draw main line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Draw direction flow arrows along the line
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const arrowCount = Math.max(1, Math.floor(distance / 100)); // One arrow per ~100px
    const arrowSize = 6;
    
    ctx.fillStyle = color;
    for (let i = 1; i <= arrowCount; i++) {
        const t = i / (arrowCount + 1);
        const arrowX = x1 + (x2 - x1) * t;
        const arrowY = y1 + (y2 - y1) * t;
        
        // Draw small directional arrow
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
            arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
            arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
            arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
            arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    }
    
    // Draw end arrow head
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
    
    lastX = e.clientX;
    lastY = e.clientY;
    
    const node = getNodeAtPosition(x, y);
    if (!node) {
        isPanning = true;
        panStartX = panX;
        panStartY = panY;
        canvas.style.cursor = 'grab';
    }
}

function handleCanvasMouseMove(e) {
    if (isPanning) {
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        
        panX += deltaX;
        panY += deltaY;
        
        lastX = e.clientX;
        lastY = e.clientY;
        
        canvas.style.cursor = 'grabbing';
        renderDiagram();
    } else {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - panX) / zoomLevel;
        const y = (e.clientY - rect.top - panY) / zoomLevel;
        
        const node = getNodeAtPosition(x, y);
        const foundConnections = getConnectionAtPosition(x, y);
        
        // Check if hovered node changed
        if (node && node.id !== hoveredNodeId) {
            hoveredNodeId = node.id;
            // Show all connections for this node
            const nodeConnections = getNodeConnections(node.id);
            if (nodeConnections && nodeConnections.length > 0) {
                showConnectionTooltip(e, nodeConnections);
            } else {
                hideConnectionTooltip();
            }
            renderDiagram();
        } else if (!node && hoveredNodeId) {
            hoveredNodeId = null;
            hideConnectionTooltip();
            renderDiagram();
        } else if (node && hoveredNodeId === node.id) {
            // Update tooltip position as mouse moves over same node
            if (connectionTooltip) {
                connectionTooltip.style.left = (e.clientX + 10) + 'px';
                connectionTooltip.style.top = (e.clientY + 10) + 'px';
            }
        }
        
        if (foundConnections && foundConnections.length > 0) {
            canvas.style.cursor = 'pointer';
            
            // Check if connections changed
            const connectionsChanged = !hoveredConnection || 
                hoveredConnection.length !== foundConnections.length ||
                !hoveredConnection.every((conn, idx) => 
                    conn.sourceId === foundConnections[idx].sourceId &&
                    conn.targetId === foundConnections[idx].targetId &&
                    conn.type === foundConnections[idx].type
                );
            
            if (connectionsChanged) {
                hoveredConnection = foundConnections;
                renderDiagram();
            }
        } else {
            canvas.style.cursor = node ? 'pointer' : 'grab';
            if (hoveredConnection) {
                hoveredConnection = null;
                renderDiagram();
            }
        }
    }
}

function handleCanvasMouseUp() {
    isPanning = false;
    canvas.style.cursor = 'grab';
}

function handleCanvasMouseLeave() {
    hoveredConnection = null;
    hoveredNodeId = null;
    isPanning = false;
    canvas.style.cursor = 'grab';
    hideConnectionTooltip();
    renderDiagram();
}

function handleCanvasClick(e) {
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


// Touch event handlers for mobile pan and zoom
function handleTouchStart(e) {
    if (e.touches.length === 1) {
        // Single touch - panning
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        isPanning = true;
        panStartX = panX;
        panStartY = panY;
    } else if (e.touches.length === 2) {
        // Two finger touch - pinch zoom
        isPanning = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchDistance = Math.sqrt(dx * dx + dy * dy);
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    
    if (e.touches.length === 1 && isPanning) {
        // Single touch panning
        const deltaX = e.touches[0].clientX - lastX;
        const deltaY = e.touches[0].clientY - lastY;
        
        panX += deltaX;
        panY += deltaY;
        
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        
        renderDiagram();
    } else if (e.touches.length === 2) {
        // Two finger pinch zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDistance = Math.sqrt(dx * dx + dy * dy);
        
        if (touchDistance > 0) {
            const scale = newDistance / touchDistance;
            const newZoom = Math.max(0.3, Math.min(3, zoomLevel * scale));
            
            // Zoom towards center of touch points
            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            
            panX = centerX - (centerX - panX) * (newZoom / zoomLevel);
            panY = centerY - (centerY - panY) * (newZoom / zoomLevel);
            
            zoomLevel = newZoom;
            touchDistance = newDistance;
            
            renderDiagram();
        }
    }
}

function handleTouchEnd(e) {
    isPanning = false;
    touchDistance = 0;
}

// Connection hover detection and tooltip functions

function getConnectionAtPosition(x, y) {
    const tolerance = 15; // Pixels away from line to detect hover
    const hoveredConnections = [];
    
    for (let conn of connections) {
        const distance = pointToLineDistance(x, y, conn.x1, conn.y1, conn.x2, conn.y2);
        if (distance < tolerance) {
            hoveredConnections.push({
                connection: conn,
                distance: distance
            });
        }
    }
    
    // Sort by distance (closest first)
    hoveredConnections.sort((a, b) => a.distance - b.distance);
    
    // Return array of connections, or null if none found
    return hoveredConnections.length > 0 ? hoveredConnections.map(h => h.connection) : null;
}

function getNodeConnections(nodeId) {
    // Get all connections where this node is source or target
    const nodeConnections = [];
    
    for (let conn of connections) {
        if (conn.sourceId == nodeId || conn.targetId == nodeId) {
            nodeConnections.push(conn);
        }
    }
    
    return nodeConnections.length > 0 ? nodeConnections : null;
}

function pointToLineDistance(px, py, x1, y1, x2, y2) {
    // Calculate perpendicular distance from point to line segment
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

function showConnectionTooltip(e, connectionsArray) {
    // Remove existing tooltip if any
    hideConnectionTooltip();
    
    // Ensure connectionsArray is an array
    if (!Array.isArray(connectionsArray)) {
        connectionsArray = [connectionsArray];
    }
    
    // Create tooltip element
    connectionTooltip = document.createElement('div');
    connectionTooltip.className = 'connection-tooltip';
    
    // Build HTML for all connections
    let tooltipHTML = '';
    connectionsArray.forEach((connection, index) => {
        const typeStyle = CONNECTION_TYPES[connection.type] || CONNECTION_TYPES['HTTP'];
        const typeLabel = typeStyle.label;
        
        // Add separator between multiple connections
        if (index > 0) {
            tooltipHTML += '<div style="border-top: 1px solid #334155; margin: 6px 0;"></div>';
        }
        
        tooltipHTML += `
            <div style="font-weight: 600; margin-bottom: 4px; color: ${typeStyle.color};">${typeLabel}</div>
            <div style="font-size: 12px; color: #cbd5e1;">
                ${connection.sourceName} → ${connection.targetName}
            </div>
        `;
    });
    
    connectionTooltip.innerHTML = tooltipHTML;
    
    // Style the tooltip
    connectionTooltip.style.position = 'fixed';
    connectionTooltip.style.left = (e.clientX + 10) + 'px';
    connectionTooltip.style.top = (e.clientY + 10) + 'px';
    connectionTooltip.style.backgroundColor = '#1e293b';
    connectionTooltip.style.border = '2px solid #334155';
    connectionTooltip.style.borderRadius = '6px';
    connectionTooltip.style.padding = '8px 12px';
    connectionTooltip.style.fontSize = '13px';
    connectionTooltip.style.color = '#e2e8f0';
    connectionTooltip.style.zIndex = '1000';
    connectionTooltip.style.pointerEvents = 'none';
    connectionTooltip.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    connectionTooltip.style.whiteSpace = 'nowrap';
    connectionTooltip.style.maxWidth = '300px';
    
    document.body.appendChild(connectionTooltip);
}

function hideConnectionTooltip() {
    if (connectionTooltip) {
        connectionTooltip.remove();
        connectionTooltip = null;
    }
}

// Update renderDiagram to highlight hovered connections
function renderDiagramWithHover() {
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
    
    // Draw connections with hover highlighting
    connections = [];
    allLayers.forEach(layer => {
        if (layer.connections) {
            layer.connections.forEach(conn => {
                const targetId = typeof conn === 'object' ? conn.targetId : conn;
                const connectionType = typeof conn === 'object' ? conn.type : 'HTTP';
                const target = allLayers.find(l => l.id == targetId);
                
                const actualTargetId = target ? target.id : targetId;
                
                if (target && nodePositions[layer.id] && nodePositions[actualTargetId]) {
                    const isSubstackConnection = typeof layer.id === 'string' && layer.id.includes('_');
                    const isTargetSubstack = typeof actualTargetId === 'string' && actualTargetId.includes('_');
                    
                    const x1 = nodePositions[layer.id].x;
                    const y1 = nodePositions[layer.id].y;
                    const x2 = nodePositions[actualTargetId].x;
                    const y2 = nodePositions[actualTargetId].y;
                    
                    const connObj = {
                        x1, y1, x2, y2,
                        sourceId: layer.id,
                        sourceName: layer.name,
                        targetId: actualTargetId,
                        targetName: target.name,
                        type: connectionType,
                        isSubstack: isSubstackConnection || isTargetSubstack
                    };
                    connections.push(connObj);
                    
                    // Check if this connection is in the hovered connections array
                    let isHovered = false;
                    if (hoveredConnection && Array.isArray(hoveredConnection)) {
                        isHovered = hoveredConnection.some(hc => 
                            hc.sourceId === connObj.sourceId && 
                            hc.targetId === connObj.targetId &&
                            hc.type === connObj.type
                        );
                    }
                    
                    // Check if connection should be faded (node hover highlighting)
                    let isFaded = false;
                    if (hoveredNodeId) {
                        // Connection is faded if it doesn't involve the hovered node
                        const connectionInvolvesHoveredNode = 
                            connObj.sourceId == hoveredNodeId || 
                            connObj.targetId == hoveredNodeId;
                        isFaded = !connectionInvolvesHoveredNode;
                    }
                    
                    drawConnection(x1, y1, x2, y2, isSubstackConnection || isTargetSubstack, connectionType, isHovered, isFaded);
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
