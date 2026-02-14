/**
 * Details View Module
 * Handles the right panel showing layer/action details
 */

function renderLayerDetails(layer) {
    const detailsDiv = document.getElementById('layer-details');
    const availableTargets = getAvailableConnectionTargets(layer);
    
    // Normalize connections to object format for consistent handling
    const normalizedConnections = (layer.connections || []).map(c => 
        typeof c === 'object' ? c : { targetId: c, type: 'HTTP' }
    );
    
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
                    Connections <span style="font-size: 10px; margin-left: 4px; opacity: 0.7;">${normalizedConnections.length}</span>
                </button>
                <button class="detail-tab" data-tab="cost" onclick="switchDetailTab('cost')">
                    Cost
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
                            <span style="font-size: 11px; color: #64748b;">${normalizedConnections.length}/${availableTargets.length}</span>
                        </div>
                        <div style="font-size: 11px; color: #64748b; margin-bottom: 8px; flex-shrink: 0;">
                            ${inSubstack ? 'Connections from this substack component' : 'Connections from this layer'}
                        </div>
                        <input type="text" id="${searchInputId}" class="detail-input" placeholder="Search connections..." 
                               style="margin-bottom: 8px; font-size: 12px; flex-shrink: 0;" 
                               onkeyup="filterConnections('${searchInputId}', '${layer.id}')">
                        <div class="connections-list" style="flex: 1; overflow-y: auto; border: 1px solid #334155; border-radius: 4px; padding: 8px; min-height: 0;">
                            ${availableTargets.length === 0 ? '<span style="color: #64748b; font-size: 12px;">No available targets</span>' : ''}
                            ${availableTargets.map(target => {
                                const existingConnection = normalizedConnections.find(c => c.targetId == target.id);
                                const connectionType = existingConnection ? existingConnection.type : 'HTTP';
                                return `
                                <div class="connection-item" data-search="${(target.name + target.type).toLowerCase()}" style="display: flex; align-items: center; gap: 8px; padding: 8px 6px; cursor: pointer; border-radius: 3px; transition: background 0.2s; margin-bottom: 4px; border: 1px solid #334155;" onmouseover="this.style.background='#1e293b'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" ${existingConnection ? 'checked' : ''} 
                                           onchange="toggleConnection('${target.id}', this.checked, '${connectionType}')">
                                    <div style="flex: 1; min-width: 0;">
                                        <div style="font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${target.name}</div>
                                        <div style="font-size: 10px; color: #64748b;">${target.type}${target.isSubstack ? ' • substack' : ''}</div>
                                    </div>
                                    <select id="type-${target.id}" class="detail-select" style="font-size: 11px; padding: 4px 6px; width: auto;" 
                                            onchange="updateConnectionType('${target.id}', this.value)" ${!existingConnection ? 'disabled' : ''}>
                                        ${Object.entries(CONNECTION_TYPES).map(([key, val]) => 
                                            `<option value="${key}" ${connectionType === key ? 'selected' : ''}>${val.label}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                            `}).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- Cost Tab -->
                <div class="detail-tab-content" data-tab="cost" style="display: none; flex-direction: column; gap: 16px; padding: 16px 16px 16px 0; overflow-y: auto; padding-right: 16px;">
                    <div style="background: #1e293b; border: 1px solid #334155; border-radius: 4px; padding: 12px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                        <strong style="color: #e2e8f0;">Cost Model:</strong><br>
                        • <strong>Fixed Cost:</strong> Monthly infrastructure cost (e.g., $80/month)<br>
                        • <strong>Variable Cost:</strong> Per-use cost (e.g., $0.0000001/request)
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="detail-section" style="margin-bottom: 0;">
                            <div class="detail-label">Currency</div>
                            <select class="detail-select" onchange="updateCostField('currency', this.value)">
                                ${COST_CURRENCIES.map(curr => 
                                    `<option value="${curr}" ${(layer.costModel?.currency || 'USD') === curr ? 'selected' : ''}>${curr}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="detail-section" style="margin-bottom: 0;">
                            <div class="detail-label">Period</div>
                            <select class="detail-select" onchange="updateCostField('period', this.value)">
                                ${COST_PERIODS.map(period => 
                                    `<option value="${period}" ${(layer.costModel?.period || 'month') === period ? 'selected' : ''}>${period}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="detail-section" style="margin-bottom: 0;">
                            <div class="detail-label">Fixed Cost (Monthly)</div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="color: #94a3b8; font-size: 12px;">$</span>
                                <input type="number" class="detail-input" step="0.01" value="${layer.costModel?.fixedCost || 0}" 
                                       onchange="updateCostField('fixedCost', parseFloat(this.value))">
                                <span style="color: #94a3b8; font-size: 12px;">/mo</span>
                            </div>
                        </div>
                        
                        <div class="detail-section" style="margin-bottom: 0;">
                            <div class="detail-label">Variable Cost</div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="color: #94a3b8; font-size: 12px;">$</span>
                                <input type="number" class="detail-input" step="0.00000001" value="${layer.costModel?.variableCost || 0}" 
                                       onchange="updateCostField('variableCost', parseFloat(this.value))">
                                <span style="color: #94a3b8; font-size: 12px;">per use</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section" style="margin-bottom: 0;">
                        <div class="detail-label">Notes</div>
                        <textarea class="detail-textarea" style="min-height: 80px;"
                                  placeholder="Optional documentation about costs"
                                  onchange="updateCostField('notes', this.value)">${layer.costModel?.notes || ''}</textarea>
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
