let project = null;
let selectedLayerIndex = 0;
let inSubstack = false;
let selectedSubstackIndex = 0;

async function loadProject() {
    const response = await fetch('/api/project');
    project = await response.json();
    renderLayers();
    updateStats();
    selectLayer(0);
}

function renderLayers() {
    const container = document.getElementById('stack-container');
    container.innerHTML = '';
    
    const layers = inSubstack && project.layers[selectedLayerIndex].substacks 
        ? project.layers[selectedLayerIndex].substacks 
        : project.layers;
    const currentIndex = inSubstack ? selectedSubstackIndex : selectedLayerIndex;
    
    layers.forEach((layer, index) => {
        const card = document.createElement('div');
        card.className = 'layer-card';
        card.style.color = LAYER_TYPES[layer.type];
        card.dataset.index = index;
        
        const zOffset = (layers.length - index - 1) * 20;
        card.style.zIndex = layers.length - index;
        
        if (index === currentIndex) {
            card.classList.add('selected');
        }
        
        const label = document.createElement('div');
        label.className = 'layer-label';
        if (index === currentIndex) {
            label.classList.add('selected');
        }
        const hasSubstacks = !inSubstack && layer.substacks && layer.substacks.length > 0;
        label.innerHTML = `
            <div class="label-name">${layer.name} ${hasSubstacks ? '<span style="margin-left: 8px; opacity: 0.7;">›</span>' : ''}</div>
            <div class="label-type">${layer.type}</div>
        `;
        
        card.appendChild(label);
        card.addEventListener('click', () => selectLayer(index));
        container.appendChild(card);
    });
}

function selectLayer(index, skipDetailsUpdate = false) {
    const layers = inSubstack && project.layers[selectedLayerIndex].substacks 
        ? project.layers[selectedLayerIndex].substacks 
        : project.layers;
    
    if (layers.length === 0) return;
    
    if (index < 0) {
        index = layers.length - 1;
    } else if (index >= layers.length) {
        index = 0;
    }
    
    if (inSubstack) {
        selectedSubstackIndex = index;
    } else {
        selectedLayerIndex = index;
    }
    
    if (inSubstack) {
        // Vertical stack layout for substacks
        const CARD_SPACING = 60;
        document.querySelectorAll('.layer-card').forEach((card, i) => {
            card.classList.toggle('selected', i === index);
            const label = card.querySelector('.layer-label');
            if (label) {
                label.classList.toggle('selected', i === index);
            }
            
            const yOffset = (i - index) * CARD_SPACING;
            const zOffset = (layers.length - i - 1) * 20;
            
            if (i !== index) {
                card.style.transform = `translateZ(${zOffset}px) translateY(${yOffset}px)`;
            } else {
                card.style.transform = `translateZ(${zOffset}px) translateY(${yOffset}px) scale(1.5)`;
            }
        });
    } else {
        // Circular carousel for main stack
        const containerHeight = document.getElementById('stack-container').clientHeight;
        const radius = containerHeight * 0.4;
        
        document.querySelectorAll('.layer-card').forEach((card, i) => {
            card.classList.toggle('selected', i === index);
            const label = card.querySelector('.layer-label');
            if (label) {
                label.classList.toggle('selected', i === index);
            }
            
            const anglePerCard = (Math.PI * 2) / layers.length;
            const angle = (i - index) * anglePerCard;
            
            const x = Math.cos(angle) * radius - radius * 0.7;
            const y = Math.sin(angle) * radius;
            const zOffset = (layers.length - i - 1) * 20;
            
            if (i !== index) {
                card.style.transform = `translateZ(${zOffset}px) translateX(${x}px) translateY(${y}px)`;
            } else {
                card.style.transform = `translateZ(${zOffset}px) translateX(${x}px) translateY(${y}px) scale(1.5)`;
            }
        });
    }
    
    if (!skipDetailsUpdate) {
        const currentLayer = inSubstack 
            ? project.layers[selectedLayerIndex].substacks[selectedSubstackIndex]
            : project.layers[selectedLayerIndex];
        renderLayerDetails(currentLayer);
    }
}

function enterSubstack() {
    if (!project.layers[selectedLayerIndex].substacks || 
        project.layers[selectedLayerIndex].substacks.length === 0) {
        return;
    }
    inSubstack = true;
    selectedSubstackIndex = 0;
    renderLayers();
    selectLayer(0);
}

function exitSubstack() {
    if (!inSubstack) return;
    inSubstack = false;
    renderLayers();
    selectLayer(selectedLayerIndex);
}

function renderLayerDetails(layer) {
    const detailsDiv = document.getElementById('layer-details');
    const substackSection = !inSubstack ? `
        <div class="detail-section">
            <div class="detail-label">Substacks (${layer.substacks ? layer.substacks.length : 0})</div>
            <button class="btn btn-secondary" style="width: 100%; margin-top: 8px;" onclick="addSubstackLayer()">+ Add Substack Layer</button>
        </div>
    ` : '';
    
    const allLayers = getAllLayers();
    const connectionsHtml = `
        <div class="detail-section">
            <div class="detail-label">Connections</div>
            <div style="max-height: 200px; overflow-y: auto; border: 1px solid #334155; border-radius: 4px; padding: 8px; margin-top: 8px;">
                ${allLayers.filter(l => l.id !== layer.id).map(l => `
                    <label style="display: flex; align-items: center; gap: 8px; padding: 4px; cursor: pointer;">
                        <input type="checkbox" ${(layer.connections || []).includes(l.id) ? 'checked' : ''} 
                               onchange="toggleConnection(${l.id}, this.checked)">
                        <span style="font-size: 13px;">${l.name}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `;
    
    detailsDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
                <div class="detail-section">
                    <div class="detail-label">Layer Name</div>
                    <input type="text" class="detail-input" value="${layer.name}" 
                           onchange="updateLayerField('name', this.value)">
                </div>
                
                <div class="detail-section">
                    <div class="detail-label">Type</div>
                    <select class="detail-select" onchange="updateLayerField('type', this.value)">
                        ${Object.keys(LAYER_TYPES).map(type => 
                            `<option value="${type}" ${layer.type === type ? 'selected' : ''}>${type}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="detail-section">
                    <div class="detail-label">Status</div>
                    <select class="detail-select" onchange="updateLayerField('status', this.value)">
                        <option value="Active" ${layer.status === 'Active' ? 'selected' : ''}>Active</option>
                        <option value="Inactive" ${layer.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="Deprecated" ${layer.status === 'Deprecated' ? 'selected' : ''}>Deprecated</option>
                    </select>
                </div>
                
                <div class="detail-section">
                    <div class="detail-label">Technology</div>
                    <input type="text" class="detail-input" value="${layer.technology || ''}" 
                           placeholder="e.g., React, Node.js, PostgreSQL"
                           onchange="updateLayerField('technology', this.value)">
                </div>
                
                <div class="detail-section">
                    <div class="detail-label">Description</div>
                    <textarea class="detail-textarea" 
                              onchange="updateLayerField('description', this.value)">${layer.description || ''}</textarea>
                </div>
                
                <div class="detail-section">
                    <div class="detail-label">Responsibilities</div>
                    <textarea class="detail-textarea" style="min-height: 60px;"
                              placeholder="What does this component do?"
                              onchange="updateLayerField('responsibilities', this.value)">${layer.responsibilities || ''}</textarea>
                </div>
            </div>
            
            <div>
                ${connectionsHtml}
                ${substackSection}
            </div>
        </div>
        
        <div class="action-buttons" style="margin-top: 16px;">
            <button class="btn btn-secondary" onclick="moveLayer(-1)">↑ Move Up</button>
            <button class="btn btn-secondary" onclick="moveLayer(1)">↓ Move Down</button>
        </div>
        
        <div class="action-buttons">
            <button class="btn btn-danger" onclick="deleteLayer()">Delete Layer</button>
        </div>
    `;
}

function getAllLayers() {
    const layers = [];
    project.layers.forEach(layer => {
        layers.push(layer);
        if (layer.substacks) {
            layer.substacks.forEach(sub => layers.push(sub));
        }
    });
    return layers;
}

function toggleConnection(targetId, isConnected) {
    const currentLayer = inSubstack 
        ? project.layers[selectedLayerIndex].substacks[selectedSubstackIndex]
        : project.layers[selectedLayerIndex];
    
    if (!currentLayer.connections) {
        currentLayer.connections = [];
    }
    
    if (isConnected) {
        if (!currentLayer.connections.includes(targetId)) {
            currentLayer.connections.push(targetId);
        }
    } else {
        currentLayer.connections = currentLayer.connections.filter(id => id !== targetId);
    }
    
    if (currentView === 'diagram') {
        renderDiagram();
    }
}

function addSubstackLayer() {
    const parentLayer = project.layers[selectedLayerIndex];
    if (!parentLayer.substacks) {
        parentLayer.substacks = [];
    }
    
    const newSubstack = {
        id: Date.now(),
        name: 'New Substack',
        type: parentLayer.type,
        status: 'Active',
        description: '',
        technology: '',
        responsibilities: '',
        connections: [],
        dependencies: [],
        visible: true,
        locked: false
    };
    
    parentLayer.substacks.push(newSubstack);
    renderLayerDetails(parentLayer);
    renderLayers();
}

function updateLayerField(field, value) {
    const currentLayer = inSubstack 
        ? project.layers[selectedLayerIndex].substacks[selectedSubstackIndex]
        : project.layers[selectedLayerIndex];
    currentLayer[field] = value;
    renderLayers();
    const currentIndex = inSubstack ? selectedSubstackIndex : selectedLayerIndex;
    selectLayer(currentIndex);
    updateStats();
    if (currentView === 'diagram') {
        renderDiagram();
    }
}

function moveLayer(direction) {
    const layers = inSubstack && project.layers[selectedLayerIndex].substacks 
        ? project.layers[selectedLayerIndex].substacks 
        : project.layers;
    const currentIndex = inSubstack ? selectedSubstackIndex : selectedLayerIndex;
    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= layers.length) return;
    
    [layers[currentIndex], layers[newIndex]] = 
    [layers[newIndex], layers[currentIndex]];
    
    renderLayers();
    selectLayer(newIndex);
}

function deleteLayer() {
    const layers = inSubstack && project.layers[selectedLayerIndex].substacks 
        ? project.layers[selectedLayerIndex].substacks 
        : project.layers;
    const currentIndex = inSubstack ? selectedSubstackIndex : selectedLayerIndex;
    
    if (layers.length === 1) {
        alert('Cannot delete the last layer');
        return;
    }
    
    layers.splice(currentIndex, 1);
    renderLayers();
    selectLayer(Math.max(0, currentIndex - 1));
    updateStats();
}

function updateStats() {
    document.getElementById('total-layers').textContent = project.layers.length;
    document.getElementById('active-layers').textContent = 
        project.layers.filter(l => l.status === 'Active').length;
    document.getElementById('inactive-layers').textContent = 
        project.layers.filter(l => l.status === 'Inactive' || l.status === 'Deprecated').length;
}

function exportProject() {
    const dataStr = JSON.stringify(project, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function importProject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                project = JSON.parse(event.target.result);
                document.getElementById('project-title').textContent = project.name;
                renderLayers();
                updateStats();
                selectLayer(0);
            } catch (error) {
                alert('Error loading project file');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function newProject() {
    if (confirm('Create new project? Unsaved changes will be lost.')) {
        project = {
            name: 'New Project',
            layers: []
        };
        document.getElementById('project-title').textContent = project.name;
        renderLayers();
        updateStats();
    }
}

function sortLayers(criteria) {
    const layers = inSubstack && project.layers[selectedLayerIndex].substacks 
        ? project.layers[selectedLayerIndex].substacks 
        : project.layers;
    
    if (criteria === 'manual') return;
    
    const currentLayer = layers[inSubstack ? selectedSubstackIndex : selectedLayerIndex];
    
    if (criteria === 'name') {
        layers.sort((a, b) => a.name.localeCompare(b.name));
    } else if (criteria === 'type') {
        layers.sort((a, b) => a.type.localeCompare(b.type));
    } else if (criteria === 'status') {
        const statusOrder = { 'Active': 0, 'Inactive': 1, 'Deprecated': 2 };
        layers.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    }
    
    const newIndex = layers.indexOf(currentLayer);
    if (inSubstack) {
        selectedSubstackIndex = newIndex;
    } else {
        selectedLayerIndex = newIndex;
    }
    
    renderLayers();
    selectLayer(newIndex);
}

document.getElementById('add-layer-btn').addEventListener('click', () => {
    const newLayer = {
        id: Date.now(),
        name: 'New Layer',
        type: 'Other',
        status: 'Active',
        description: '',
        technology: '',
        responsibilities: '',
        connections: [],
        dependencies: [],
        visible: true,
        locked: false,
        substacks: []
    };
    
    project.layers.unshift(newLayer);
    renderLayers();
    selectLayer(0);
    updateStats();
});

document.getElementById('sort-select').addEventListener('change', (e) => {
    sortLayers(e.target.value);
});

let isAnimating = false;

document.addEventListener('keydown', (e) => {
    if (isAnimating) return;
    
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        isAnimating = true;
        const currentIndex = inSubstack ? selectedSubstackIndex : selectedLayerIndex;
        selectLayer(currentIndex - 1);
        setTimeout(() => { isAnimating = false; }, 250);
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        isAnimating = true;
        const currentIndex = inSubstack ? selectedSubstackIndex : selectedLayerIndex;
        selectLayer(currentIndex + 1);
        setTimeout(() => { isAnimating = false; }, 250);
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        enterSubstack();
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        exitSubstack();
    }
});

let wheelTimeout;
document.getElementById('stack-container').addEventListener('wheel', (e) => {
    e.preventDefault();
    clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(() => {
        const currentIndex = inSubstack ? selectedSubstackIndex : selectedLayerIndex;
        if (e.deltaY > 0) {
            selectLayer(currentIndex + 1);
        } else {
            selectLayer(currentIndex - 1);
        }
    }, 50);
});

loadProject();


// File menu dropdown toggle
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.menu-item').forEach(menuItem => {
        const dropdown = menuItem.querySelector('.dropdown-menu');
        if (dropdown) {
            menuItem.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close other dropdowns
                document.querySelectorAll('.dropdown-menu').forEach(d => {
                    if (d !== dropdown) d.style.display = 'none';
                });
                dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            });
        }
    });
    
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu').forEach(d => d.style.display = 'none');
    });
});
