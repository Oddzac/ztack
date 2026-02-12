let project = null;
let selectedLayerIndex = 0;
let inSubstack = false;
let selectedSubstackIndex = 0;
let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 50;

function loadProject() {
    const saved = localStorage.getItem('ztack_project');
    project = saved ? JSON.parse(saved) : SAMPLE_PROJECT;
    document.getElementById('project-title').textContent = project.name;
    renderLayers();
    updateStats();
    selectLayer(0);
}

function saveProject() {
    localStorage.setItem('ztack_project', JSON.stringify(project));
}

function saveState() {
    undoStack.push(JSON.stringify(project));
    if (undoStack.length > MAX_HISTORY) {
        undoStack.shift();
    }
    redoStack = [];
}

function undo() {
    if (undoStack.length === 0) return;
    
    redoStack.push(JSON.stringify(project));
    const previousState = undoStack.pop();
    project = JSON.parse(previousState);
    
    document.getElementById('project-title').textContent = project.name;
    saveProject();
    renderLayers();
    updateStats();
    if (selectedLayerIndex >= project.layers.length) {
        selectedLayerIndex = Math.max(0, project.layers.length - 1);
    }
    selectLayer(selectedLayerIndex);
    if (currentView === 'diagram') {
        renderDiagram();
    }
}

function redo() {
    if (redoStack.length === 0) return;
    
    undoStack.push(JSON.stringify(project));
    const nextState = redoStack.pop();
    project = JSON.parse(nextState);
    
    document.getElementById('project-title').textContent = project.name;
    saveProject();
    renderLayers();
    updateStats();
    if (selectedLayerIndex >= project.layers.length) {
        selectedLayerIndex = Math.max(0, project.layers.length - 1);
    }
    selectLayer(selectedLayerIndex);
    if (currentView === 'diagram') {
        renderDiagram();
    }
}

function renderLayers() {
    const container = document.getElementById('stack-container');
    container.innerHTML = '';
    
    const layers = inSubstack && project.layers[selectedLayerIndex].substacks 
        ? project.layers[selectedLayerIndex].substacks 
        : project.layers;
    const currentIndex = inSubstack ? selectedSubstackIndex : selectedLayerIndex;
    
    // If in substack, render parent layer on the left
    if (inSubstack) {
        const parentLayer = project.layers[selectedLayerIndex];
        const parentCard = document.createElement('div');
        parentCard.className = 'layer-card parent-layer';
        parentCard.style.color = LAYER_TYPES[parentLayer.type];
        parentCard.style.transform = 'translateX(-300px) scale(0.8)';
        parentCard.style.opacity = '0.6';
        parentCard.style.zIndex = '1';
        
        const parentLabel = document.createElement('div');
        parentLabel.className = 'layer-label';
        parentLabel.style.left = '250px';
        parentLabel.style.opacity = '1';
        parentLabel.innerHTML = `
            <div class="label-name" style="font-size: 18px;">${parentLayer.name}</div>
            <div class="label-type" style="font-size: 11px;">Parent Layer</div>
        `;
        parentCard.appendChild(parentLabel);
        parentCard.addEventListener('click', exitSubstack);
        container.appendChild(parentCard);
    }
    
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
        const substackPreview = hasSubstacks ? `
            <span style="font-size: 12px; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px; cursor: pointer; transition: background 0.2s;" 
                  onmouseover="this.style.background='rgba(255,255,255,0.2)'" 
                  onmouseout="this.style.background='rgba(255,255,255,0.1)'"
                  onclick="event.stopPropagation(); enterSubstack();">(${layer.substacks.length})</span>
        ` : '';
        const displayName = layer.name.length > 20 ? layer.name : `<span style="white-space: nowrap;">${layer.name}</span>`;
        label.innerHTML = `
            <div class="label-name" style="max-width: 300px; word-wrap: break-word; white-space: normal; line-height: 1.3;">${displayName}</div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                <div class="label-type">${layer.type}</div>
                ${substackPreview}
            </div>
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
        document.querySelectorAll('.layer-card:not(.parent-layer)').forEach((card, i) => {
            card.classList.toggle('selected', i === index);
            const label = card.querySelector('.layer-label');
            if (label) {
                label.classList.toggle('selected', i === index);
            }
            
            const yOffset = (i - index) * CARD_SPACING;
            const zOffset = (layers.length - i - 1) * 20;
            
            if (i !== index) {
                card.style.transform = `translateZ(${zOffset}px) translateY(${yOffset}px) translateX(150px)`;
            } else {
                card.style.transform = `translateZ(${zOffset}px) translateY(${yOffset}px) translateX(150px) scale(1.5)`;
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
    const availableTargets = getAvailableConnectionTargets(layer);
    
    // Generate unique ID for this layer's search input
    const searchInputId = `conn-search-${layer.id}`;
    
    const substackList = layer.substacks && layer.substacks.length > 0 ? `
        <div style="display: flex; flex-direction: column; gap: 8px;">
            ${layer.substacks.map((sub, idx) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: #1e293b; border: 1px solid #334155; border-radius: 4px; cursor: pointer;" onclick="enterSubstack(); selectLayer(${idx})">
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 13px; font-weight: 500; color: #e2e8f0;">${sub.name}</div>
                        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${sub.type} • ${sub.status}</div>
                    </div>
                    <div style="font-size: 12px; color: #94a3b8; margin-left: 8px;">→</div>
                </div>
            `).join('')}
        </div>
    ` : `
        <div style="padding: 16px; text-align: center; color: #64748b; font-size: 13px;">
            No substacks yet. Click the button below to add one.
        </div>
    `;
    
    const substackSection = !inSubstack ? `
        <div class="detail-section" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 0;">
            <div class="detail-label">Substacks (${layer.substacks ? layer.substacks.length : 0})</div>
            ${substackList}
            <button class="btn btn-secondary" style="width: 100%; margin-top: 8px;" onclick="addSubstackLayer()">+ Add Substack Layer</button>
        </div>
    ` : '';
    
    detailsDiv.innerHTML = `
        <div style="display: flex; flex-direction: column; height: 100%; gap: 0;">
            <!-- Tab Navigation -->
            <div class="detail-tabs">
                <button class="detail-tab active" data-tab="properties" onclick="switchDetailTab('properties')">
                    Properties
                </button>
                <button class="detail-tab" data-tab="connections" onclick="switchDetailTab('connections')">
                    Connections <span style="font-size: 10px; margin-left: 4px; opacity: 0.7;">${(layer.connections || []).length}</span>
                </button>
                ${!inSubstack ? `
                    <button class="detail-tab" data-tab="substacks" onclick="switchDetailTab('substacks')">
                        Substacks <span style="font-size: 10px; margin-left: 4px; opacity: 0.7;">${layer.substacks ? layer.substacks.length : 0}</span>
                    </button>
                ` : ''}
            </div>
            
            <!-- Tab Content -->
            <div style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
                <!-- Properties Tab -->
                <div class="detail-tab-content active" data-tab="properties" style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 16px 0; overflow-y: auto; padding-right: 16px;">
                    <div class="detail-section" style="margin-bottom: 0;">
                        <div class="detail-label">Layer Name</div>
                        <input type="text" class="detail-input" value="${layer.name}" 
                               onchange="updateLayerField('name', this.value)">
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="detail-section" style="margin-bottom: 0;">
                            <div class="detail-label">Type</div>
                            <select class="detail-select" onchange="updateLayerField('type', this.value)">
                                ${Object.keys(LAYER_TYPES).map(type => 
                                    `<option value="${type}" ${layer.type === type ? 'selected' : ''}>${type}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="detail-section" style="margin-bottom: 0;">
                            <div class="detail-label">Status</div>
                            <select class="detail-select" onchange="updateLayerField('status', this.value)">
                                <option value="Active" ${layer.status === 'Active' ? 'selected' : ''}>Active</option>
                                <option value="Inactive" ${layer.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                                <option value="Deprecated" ${layer.status === 'Deprecated' ? 'selected' : ''}>Deprecated</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="detail-section" style="margin-bottom: 0;">
                        <div class="detail-label">Technology</div>
                        <input type="text" class="detail-input" value="${layer.technology || ''}" 
                               placeholder="e.g., React, Node.js, PostgreSQL"
                               onchange="updateLayerField('technology', this.value)">
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="detail-section" style="margin-bottom: 0;">
                            <div class="detail-label">Description</div>
                            <textarea class="detail-textarea" style="min-height: 100px;"
                                      onchange="updateLayerField('description', this.value)">${layer.description || ''}</textarea>
                        </div>
                        
                        <div class="detail-section" style="margin-bottom: 0;">
                            <div class="detail-label">Responsibilities</div>
                            <textarea class="detail-textarea" style="min-height: 100px;"
                                      placeholder="What does this component do?"
                                      onchange="updateLayerField('responsibilities', this.value)">${layer.responsibilities || ''}</textarea>
                        </div>
                    </div>
                    
                    <!-- Properties Tab Actions -->
                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <button class="btn btn-secondary" style="flex: 1;" onclick="moveLayer(-1)" title="Move layer up">↑ Move Up</button>
                        <button class="btn btn-secondary" style="flex: 1;" onclick="moveLayer(1)" title="Move layer down">↓ Move Down</button>
                    </div>
                    
                    <button class="btn btn-danger" style="width: 100%;" onclick="deleteLayer()">Delete ${inSubstack ? 'Substack Component' : 'Layer'}</button>
                </div>
                
                <!-- Connections Tab -->
                <div class="detail-tab-content" data-tab="connections" style="display: none; flex-direction: column; gap: 16px; padding: 16px 0; min-height: 0;">
                    <div class="detail-section" style="display: flex; flex-direction: column; flex: 1; min-height: 0; margin-bottom: 0;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-shrink: 0;">
                            <div class="detail-label" style="margin: 0;">Connections ${inSubstack ? '(Substack)' : '(Layer)'}</div>
                            <span style="font-size: 11px; color: #64748b;">${(layer.connections || []).length}/${availableTargets.length}</span>
                        </div>
                        <div style="font-size: 11px; color: #64748b; margin-bottom: 8px; flex-shrink: 0;">
                            ${inSubstack ? 'Connections from this substack component' : 'Connections from this layer'}
                        </div>
                        <input type="text" id="${searchInputId}" class="detail-input" placeholder="Search connections..." 
                               style="margin-bottom: 8px; font-size: 12px; flex-shrink: 0;" 
                               onkeyup="filterConnections('${searchInputId}', '${layer.id}')">
                        <div class="connections-list" style="flex: 1; overflow-y: auto; border: 1px solid #334155; border-radius: 4px; padding: 8px; min-height: 0;">
                            ${availableTargets.length === 0 ? '<span style="color: #64748b; font-size: 12px;">No available targets</span>' : ''}
                            ${availableTargets.map(target => `
                                <label class="connection-item" data-search="${(target.name + target.type).toLowerCase()}" style="display: flex; align-items: center; gap: 8px; padding: 8px 6px; cursor: pointer; border-radius: 3px; transition: background 0.2s; margin-bottom: 4px;" onmouseover="this.style.background='#1e293b'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" ${(layer.connections || []).includes(target.id) ? 'checked' : ''} 
                                           onchange="toggleConnection('${target.id}', this.checked)">
                                    <div style="flex: 1; min-width: 0;">
                                        <div style="font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${target.name}</div>
                                        <div style="font-size: 10px; color: #64748b;">${target.type}${target.isSubstack ? ' • substack' : ''}</div>
                                    </div>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- Substacks Tab -->
                ${!inSubstack ? `
                    <div class="detail-tab-content" data-tab="substacks" style="display: none; flex-direction: column; gap: 16px; padding: 16px 16px 16px 0; overflow-y: auto; padding-right: 16px;">
                        ${substackSection}
                    </div>
                ` : ''}
            </div>
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

function getAvailableConnectionTargets(layer) {
    const targets = [];
    
    if (inSubstack) {
        // When editing a substack, show:
        // 1. All main layers (except parent)
        // 2. Substacks from other parents
        // 3. Sibling substacks
        const parentLayer = project.layers[selectedLayerIndex];
        
        project.layers.forEach(mainLayer => {
            if (mainLayer.id !== parentLayer.id) {
                targets.push({
                    id: mainLayer.id,
                    name: mainLayer.name,
                    type: mainLayer.type,
                    isSubstack: false
                });
            }
            
            // Add substacks from other parents
            if (mainLayer.substacks && mainLayer.substacks.length > 0) {
                mainLayer.substacks.forEach(sub => {
                    if (sub.id !== layer.id) { // Don't connect to self
                        targets.push({
                            id: sub.id,
                            name: `${sub.name} (${mainLayer.name})`,
                            type: sub.type,
                            isSubstack: true
                        });
                    }
                });
            }
        });
        
        // Add sibling substacks
        if (parentLayer.substacks) {
            parentLayer.substacks.forEach(sub => {
                if (sub.id !== layer.id) {
                    targets.push({
                        id: sub.id,
                        name: `${sub.name} (sibling)`,
                        type: sub.type,
                        isSubstack: true
                    });
                }
            });
        }
    } else {
        // When editing a main layer, show all other main layers
        project.layers.forEach(mainLayer => {
            if (mainLayer.id !== layer.id) {
                targets.push({
                    id: mainLayer.id,
                    name: mainLayer.name,
                    type: mainLayer.type,
                    isSubstack: false
                });
            }
        });
    }
    
    return targets;
}

function filterConnections(searchInputId, layerId) {
    const searchInput = document.getElementById(searchInputId);
    const searchTerm = searchInput.value.toLowerCase();
    const connectionItems = document.querySelectorAll('.connection-item');
    
    connectionItems.forEach(item => {
        const searchText = item.getAttribute('data-search');
        if (searchText.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function switchDetailTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.detail-tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.detail-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.querySelector(`.detail-tab-content[data-tab="${tabName}"]`);
    if (selectedTab) {
        selectedTab.style.display = 'flex';
    }
    
    // Add active class to clicked button
    const selectedBtn = document.querySelector(`.detail-tab[data-tab="${tabName}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
}

function toggleConnection(targetId, isConnected) {
    const currentLayer = inSubstack 
        ? project.layers[selectedLayerIndex].substacks[selectedSubstackIndex]
        : project.layers[selectedLayerIndex];
    
    if (!currentLayer.connections) {
        currentLayer.connections = [];
    }
    
    saveState();
    
    if (isConnected) {
        if (!currentLayer.connections.includes(targetId)) {
            currentLayer.connections.push(targetId);
        }
    } else {
        currentLayer.connections = currentLayer.connections.filter(id => id !== targetId);
    }
    
    saveProject();
    if (currentView === 'diagram') {
        renderDiagram();
    }
}

function addSubstackLayer() {
    const parentLayer = project.layers[selectedLayerIndex];
    if (!parentLayer.substacks) {
        parentLayer.substacks = [];
    }
    
    saveState();
    
    const substackIndex = parentLayer.substacks.length + 1;
    const newSubstack = {
        id: `${parentLayer.id}_${substackIndex}`,
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
    saveProject();
    renderLayerDetails(parentLayer);
    renderLayers();
}

function updateLayerField(field, value) {
    saveState();
    
    const currentLayer = inSubstack 
        ? project.layers[selectedLayerIndex].substacks[selectedSubstackIndex]
        : project.layers[selectedLayerIndex];
    currentLayer[field] = value;
    saveProject();
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
    
    saveState();
    
    [layers[currentIndex], layers[newIndex]] = 
    [layers[newIndex], layers[currentIndex]];
    
    saveProject();
    renderLayers();
    selectLayer(newIndex);
}

function deleteLayer() {
    const layers = inSubstack && project.layers[selectedLayerIndex].substacks 
        ? project.layers[selectedLayerIndex].substacks 
        : project.layers;
    const currentIndex = inSubstack ? selectedSubstackIndex : selectedLayerIndex;
    
    // Only prevent deletion if it's a main layer and it's the last one
    if (!inSubstack && layers.length === 1) {
        alert('Cannot delete the last layer');
        return;
    }
    
    const itemType = inSubstack ? 'substack component' : 'layer';
    if (!confirm(`Delete this ${itemType}?`)) {
        return;
    }
    
    saveState();
    
    layers.splice(currentIndex, 1);
    saveProject();
    renderLayers();
    
    if (layers.length > 0) {
        selectLayer(Math.max(0, currentIndex - 1));
    } else if (inSubstack) {
        // If all substacks deleted, exit to parent
        exitSubstack();
    }
    
    updateStats();
    if (currentView === 'diagram') {
        renderDiagram();
    }
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
                saveProject();
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
        saveProject();
        renderLayers();
        updateStats();
    }
}

function editProjectName() {
    const currentName = project.name;
    const newName = prompt('Enter project name:', currentName);
    if (newName && newName.trim() !== '') {
        saveState();
        project.name = newName.trim();
        document.getElementById('project-title').textContent = project.name;
        saveProject();
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
    saveState();
    
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
    saveProject();
    renderLayers();
    selectLayer(0);
    updateStats();
});

document.getElementById('sort-select').addEventListener('change', (e) => {
    sortLayers(e.target.value);
});

let isAnimating = false;

document.addEventListener('keydown', (e) => {
    // Undo/Redo shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
    }
    
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
}, { passive: false });

loadProject();

// Toggle details panel
function toggleDetailsPanel() {
    const panel = document.getElementById('details-panel');
    const toggle = document.getElementById('panel-toggle');
    panel.classList.toggle('collapsed');
    toggle.textContent = panel.classList.contains('collapsed') ? '▶' : '◀';
    toggle.style.right = panel.classList.contains('collapsed') ? '0' : '500px';
    
    // Resize canvas when panel toggles
    setTimeout(() => {
        if (currentView === 'diagram' && canvas) {
            resizeCanvas();
        }
    }, 300);
}

// Touch/swipe support for mobile
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    if (Math.abs(deltaX) < 50 && Math.abs(deltaY) < 50) return;
    
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
        const currentIndex = inSubstack ? selectedSubstackIndex : selectedLayerIndex;
        if (deltaY < 0) {
            selectLayer(currentIndex + 1);
        } else {
            selectLayer(currentIndex - 1);
        }
    } else {
        if (deltaX < 0) {
            enterSubstack();
        } else {
            exitSubstack();
        }
    }
}

document.getElementById('stack-container').addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.getElementById('stack-container').addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}, { passive: true });


// File menu dropdown toggle
document.addEventListener('DOMContentLoaded', () => {
    // Update navigation instructions for mobile
    if ('ontouchstart' in window) {
        document.getElementById('nav-instructions').textContent = 'Swipe Up/Down • Swipe Left/Right for Substacks';
    }
    
    document.querySelectorAll('.menu-item').forEach(menuItem => {
        const dropdown = menuItem.querySelector('.dropdown-menu');
        if (dropdown) {
            menuItem.addEventListener('click', (e) => {
                e.stopPropagation();
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
    
    // Touch support for diagram canvas
    const canvas = document.getElementById('diagram-canvas');
    let touchStartXDiagram = 0;
    let touchStartYDiagram = 0;
    
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            touchStartXDiagram = touch.clientX - rect.left;
            touchStartYDiagram = touch.clientY - rect.top;
            handleCanvasMouseDown({ offsetX: touchStartXDiagram, offsetY: touchStartYDiagram });
        }
    }, { passive: true });
    
    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            handleCanvasMouseMove({ offsetX: x, offsetY: y });
        }
    }, { passive: false });
    
    canvas.addEventListener('touchend', (e) => {
        handleCanvasMouseUp();
        if (e.changedTouches.length === 1) {
            const touch = e.changedTouches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            if (Math.abs(x - touchStartXDiagram) < 10 && Math.abs(y - touchStartYDiagram) < 10) {
                handleCanvasClick({ offsetX: x, offsetY: y });
            }
        }
    }, { passive: true });
});
