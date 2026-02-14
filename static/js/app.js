let project = null;
let selectedLayerIndex = 0;
let inSubstack = false;
let selectedSubstackIndex = 0;
let undoStack = [];
let redoStack = [];
let selectedActionId = null;  // Track selected action in Actions View
let actionsViewCollapsed = false;  // Track if Actions section is collapsed
let pathsViewCollapsed = false;  // Track if Paths section is collapsed
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

// Debug helper function - call from console to log cost badge rendering
function debugCostBadges() {
    console.log('\n========== COST BADGE DEBUG ==========');
    project.layers.forEach((layer, idx) => {
        const components = getLayerCostComponents(layer);
        const totalCost = calculateTotalLayerCost(layer);
        console.log(`\nLayer ${idx}: ${layer.name}`);
        console.log(`  Total Cost: $${totalCost}`);
        console.log(`  Cost Components: ${components.length}`);
        components.forEach(comp => {
            console.log(`    - ${comp.type}: ${comp.currency}${comp.amount} ${comp.unit || comp.period}`);
        });
        
        if (layer.substacks && layer.substacks.length > 0) {
            console.log(`  Substacks: ${layer.substacks.length}`);
            layer.substacks.forEach((sub, subIdx) => {
                if (sub.costModel && (sub.costModel.fixedCost > 0 || sub.costModel.variableCost > 0)) {
                    console.log(`    [${subIdx}] ${sub.name}: $${sub.costModel.fixedCost}${sub.costModel.period === 'month' ? '/mo' : ''}`);
                }
            });
        }
    });
    console.log('========== END DEBUG ==========\n');
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

function calculateTotalLayerCost(layer) {
    // Calculate total cost including substacks
    let totalCost = layer.costModel?.fixedCost || 0;
    
    // Add costs from all substacks
    if (layer.substacks && layer.substacks.length > 0) {
        layer.substacks.forEach(substack => {
            totalCost += substack.costModel?.fixedCost || 0;
        });
    }
    
    return totalCost;
}

function getLayerCostComponents(layer) {
    // Collect all cost components (layer + substacks) with their periods
    const components = [];
    
    // Add layer's own costs
    if (layer.costModel) {
        if (layer.costModel.fixedCost > 0) {
            components.push({
                amount: layer.costModel.fixedCost,
                period: layer.costModel.period,
                currency: layer.costModel.currency,
                type: 'fixed',
                source: layer.name
            });
        }
        if (layer.costModel.variableCost > 0) {
            components.push({
                amount: layer.costModel.variableCost,
                period: layer.costModel.period,
                currency: layer.costModel.currency,
                unit: layer.costModel.variableUnit,
                type: 'variable',
                source: layer.name
            });
        }
    }
    
    // Add substack costs
    if (layer.substacks && layer.substacks.length > 0) {
        layer.substacks.forEach(substack => {
            if (substack.costModel) {
                if (substack.costModel.fixedCost > 0) {
                    components.push({
                        amount: substack.costModel.fixedCost,
                        period: substack.costModel.period,
                        currency: substack.costModel.currency,
                        type: 'fixed',
                        source: substack.name
                    });
                }
                if (substack.costModel.variableCost > 0) {
                    components.push({
                        amount: substack.costModel.variableCost,
                        period: substack.costModel.period,
                        currency: substack.costModel.currency,
                        unit: substack.costModel.variableUnit,
                        type: 'variable',
                        source: substack.name
                    });
                }
            }
        });
    }
    
    return components;
}

function groupCostsByPeriod(components) {
    // Group costs by period and type, aggregating amounts
    const grouped = {};
    
    components.forEach(comp => {
        // Create key from period and type (variable costs also include unit)
        const key = comp.type === 'variable' && comp.unit 
            ? `${comp.period}|${comp.type}|${comp.unit}`
            : `${comp.period}|${comp.type}`;
        
        if (!grouped[key]) {
            grouped[key] = {
                amount: 0,
                period: comp.period,
                currency: comp.currency,
                type: comp.type,
                unit: comp.unit
            };
        }
        
        grouped[key].amount += comp.amount;
    });
    
    // Convert to array and sort by period (fixed first, then by period name)
    return Object.values(grouped).sort((a, b) => {
        if (a.type !== b.type) return a.type === 'fixed' ? -1 : 1;
        return a.period.localeCompare(b.period);
    });
}

function formatCostComponent(component) {
    const currency = component.currency || 'USD';
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
    
    let periodLabel = '';
    if (component.period === 'month') periodLabel = '/mo';
    else if (component.period === 'year') periodLabel = '/yr';
    else if (component.period === 'per-request') periodLabel = '/req';
    else if (component.period === 'per-gb') periodLabel = '/GB';
    else if (component.period === 'per-hour') periodLabel = '/hr';
    else periodLabel = `/${component.period}`;
    
    if (component.type === 'variable' && component.unit) {
        return `${symbol}${component.amount} ${component.unit}`;
    }
    
    return `${symbol}${component.amount}${periodLabel}`;
}

function aggregateStackCosts(layers) {
    // Aggregate all costs from all layers and substacks
    const allComponents = [];
    
    layers.forEach(layer => {
        const components = getLayerCostComponents(layer);
        allComponents.push(...components);
    });
    
    // Group by period and variable unit (combine similar variable costs)
    const grouped = {};
    
    allComponents.forEach(comp => {
        // For variable costs, group by unit; for fixed, group by period
        const key = comp.type === 'variable' && comp.unit 
            ? `${comp.type}|${comp.unit}`
            : `${comp.period}|${comp.type}`;
        
        if (!grouped[key]) {
            grouped[key] = {
                amount: 0,
                period: comp.period,
                currency: comp.currency,
                type: comp.type,
                unit: comp.unit,
                contributors: []
            };
        }
        
        grouped[key].amount += comp.amount;
        grouped[key].contributors.push(comp);
    });
    
    // Convert to array and sort
    return Object.values(grouped).sort((a, b) => {
        if (a.type !== b.type) return a.type === 'fixed' ? -1 : 1;
        return a.period.localeCompare(b.period);
    });
}

function consolidateVariableCosts(aggregated) {
    // Consolidate variable costs into semantic buckets
    const fixed = aggregated.filter(a => a.type === 'fixed');
    const variable = aggregated.filter(a => a.type === 'variable');
    
    // Group variable costs by semantic category
    const buckets = {
        'requests': [],
        'storage': [],
        'data': [],
        'compute': [],
        'other': []
    };
    
    variable.forEach(v => {
        const unit = (v.unit || '').toLowerCase();
        
        if (unit.includes('request') || unit.includes('call') || unit.includes('api')) {
            buckets.requests.push(v);
        } else if (unit.includes('gb') || unit.includes('storage') || unit.includes('disk')) {
            buckets.storage.push(v);
        } else if (unit.includes('log') || unit.includes('indexed') || unit.includes('scan')) {
            buckets.data.push(v);
        } else if (unit.includes('cpu') || unit.includes('memory') || unit.includes('hour') || unit.includes('compute')) {
            buckets.compute.push(v);
        } else {
            buckets.other.push(v);
        }
    });
    
    // Build consolidated result
    const consolidated = [...fixed];
    
    // Add consolidated variable buckets
    Object.entries(buckets).forEach(([category, items]) => {
        if (items.length > 0) {
            // Sum amounts for this bucket and flatten all contributors
            const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
            
            // Flatten contributors from all items in this bucket
            const allContributors = [];
            items.forEach(item => {
                if (item.contributors && Array.isArray(item.contributors)) {
                    allContributors.push(...item.contributors);
                }
            });
            
            consolidated.push({
                amount: totalAmount,
                period: null,
                currency: items[0].currency,
                type: 'variable',
                unit: category,
                isBucket: true,
                contributors: allContributors
            });
        }
    });
    
    return consolidated;
}

function formatStackCostBanner() {
    // Format the aggregated costs for display in banner, separating fixed and variable
    const aggregated = aggregateStackCosts(project.layers);
    const consolidated = consolidateVariableCosts(aggregated);
    
    if (consolidated.length === 0) {
        return 'Total: Free';
    }
    
    // Separate fixed and variable costs
    const fixedCosts = consolidated.filter(c => c.type === 'fixed');
    const variableCosts = consolidated.filter(c => c.type === 'variable');
    
    let bannerText = 'Total: ';
    
    // Format fixed costs
    if (fixedCosts.length > 0) {
        const fixedFormatted = fixedCosts.map((comp, idx) => {
            const currency = comp.currency || 'USD';
            const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
            
            let periodLabel = '';
            if (comp.period === 'month') periodLabel = '/mo';
            else if (comp.period === 'year') periodLabel = '/yr';
            else if (comp.period) periodLabel = `/${comp.period}`;
            
            return `${symbol}${comp.amount}${periodLabel}`;
        }).join(' + ');
        
        bannerText += `<strong>Fixed:</strong> ${fixedFormatted}`;
    }
    
    // Format variable costs
    if (variableCosts.length > 0) {
        const variableFormatted = variableCosts.map((comp, idx) => {
            const currency = comp.currency || 'USD';
            const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
            
            if (comp.unit) {
                // Format bucket name nicely
                const bucketName = comp.unit.charAt(0).toUpperCase() + comp.unit.slice(1);
                const bucketId = `cost-bucket-var-${idx}`;
                // Use variable-specific index for bucket ID
                return `<span id="${bucketId}" style="cursor: help; text-decoration: underline dotted; text-decoration-color: rgba(148, 163, 184, 0.5);">${symbol}${comp.amount} ${bucketName}</span>`;
            }
            
            return `${symbol}${comp.amount}`;
        }).join(' + ');
        
        if (fixedCosts.length > 0) {
            bannerText += ` || <strong>Variable:</strong> ${variableFormatted}`;
        } else {
            bannerText += `<strong>Variable:</strong> ${variableFormatted}`;
        }
    }
    
    return bannerText;
}

function buildStackCostTooltip() {
    // Build detailed tooltip showing cost breakdown grouped by layer with substacks
    if (project.layers.length === 0) {
        return '<div style="font-weight: 500;">No costs configured</div>';
    }
    
    let tooltip = '<div style="font-weight: 500; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px;">Stack Cost Breakdown:</div>';
    
    // Build layer breakdown with substacks
    const layerBreakdown = [];
    
    project.layers.forEach(layer => {
        const layerTotal = calculateTotalLayerCost(layer);
        const layerEntry = {
            name: layer.name,
            total: layerTotal,
            substacks: []
        };
        
        // Add substack costs
        if (layer.substacks && layer.substacks.length > 0) {
            layer.substacks.forEach(substack => {
                const substackCost = substack.costModel?.fixedCost || 0;
                if (substackCost > 0) {
                    layerEntry.substacks.push({
                        name: substack.name,
                        cost: substackCost
                    });
                }
            });
            
            // Sort substacks by cost descending
            layerEntry.substacks.sort((a, b) => b.cost - a.cost);
        }
        
        if (layerTotal > 0) {
            layerBreakdown.push(layerEntry);
        }
    });
    
    // Sort layers by total cost descending
    layerBreakdown.sort((a, b) => b.total - a.total);
    
    // Calculate total lines needed
    const linesPerColumn = 20;
    let totalLines = 0;
    layerBreakdown.forEach(layer => {
        totalLines += 1 + layer.substacks.length; // 1 for header + substacks
    });
    
    // Calculate optimal number of columns
    let numColumns = Math.ceil(totalLines / linesPerColumn);
    
    // Distribute layers evenly across columns
    const columns = Array.from({ length: numColumns }, () => []);
    let columnLineCount = Array(numColumns).fill(0);
    
    layerBreakdown.forEach(layer => {
        const layerLines = 1 + layer.substacks.length;
        
        // Find the column with the least lines
        let minColumn = 0;
        let minLines = columnLineCount[0];
        
        for (let i = 1; i < numColumns; i++) {
            if (columnLineCount[i] < minLines) {
                minLines = columnLineCount[i];
                minColumn = i;
            }
        }
        
        // Add layer to the column with least lines
        columns[minColumn].push(layer);
        columnLineCount[minColumn] += layerLines;
    });
    
    // Build HTML for columns
    tooltip += '<div style="display: flex; gap: 24px;">';
    
    columns.forEach(column => {
        tooltip += '<div style="flex: 0 0 auto;">';
        
        column.forEach((layer, layerIdx) => {
            const symbol = '$';
            const marginTop = layerIdx > 0 ? '8px' : '0';
            tooltip += `<div style="color: #e2e8f0; font-weight: 500; font-size: 11px; margin-bottom: 4px; margin-top: ${marginTop};">${layer.name} - ${symbol}${layer.total}/mo</div>`;
            
            // Add substacks
            layer.substacks.forEach(substack => {
                tooltip += `<div style="color: #cbd5e1; font-size: 11px; margin-bottom: 2px; white-space: nowrap; margin-left: 12px;">- ${substack.name}: ${symbol}${substack.cost}/mo</div>`;
            });
        });
        
        tooltip += '</div>';
    });
    
    tooltip += '</div>';
    
    return tooltip;
}


function renderLayers() {
    const container = document.getElementById('stack-container');
    container.innerHTML = '';
    
    const layers = inSubstack && project.layers[selectedLayerIndex].substacks 
        ? project.layers[selectedLayerIndex].substacks 
        : project.layers;
    const currentIndex = inSubstack ? selectedSubstackIndex : selectedLayerIndex;
    
    // Add cost aggregation banner at top (only for main layer view)
    if (!inSubstack) {
        console.log('[BANNER] Creating cost aggregation banner');
        
        // Remove any existing banner
        const existingBanner = document.getElementById('stack-cost-banner');
        if (existingBanner) {
            existingBanner.remove();
        }
        
        const banner = document.createElement('div');
        banner.id = 'stack-cost-banner';
        
        const gradientStyle = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(35deg, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.3) 40%, rgba(15, 23, 42, 0.95) 70%, rgba(15, 23, 42, 0.95) 100%);
            border-bottom: 1px solid rgba(51, 65, 85, 0.5);
            padding: 12px 40px;
            text-align: right;
            font-size: 12px;
            color: #94a3b8;
            z-index: 50;
            backdrop-filter: blur(4px);
            pointer-events: auto;
        `;
        
        banner.style.cssText = gradientStyle;
        
        const bannerText = formatStackCostBanner();
        
        // Parse the banner text to extract total and remaining costs
        // Format is: "Total: <strong>Fixed:</strong> $X/mo || <strong>Variable:</strong> ..."
        // or just: "Total: <strong>Fixed:</strong> $X/mo"
        
        // Extract everything after "Total: "
        const totalMatch = bannerText.match(/Total:\s*(.+?)(?:\s*\|\||$)/);
        const totalAmount = totalMatch ? totalMatch[1].trim() : '';
        
        // Check if there's a variable section after ||
        const hasVariable = bannerText.includes('||');
        const remainingCosts = hasVariable ? bannerText.replace(/Total:\s*[^|]+\|\|\s*/, '') : '';
        
        // Create a wrapper for the "Total: ..." that has the tooltip
        const totalSpan = document.createElement('span');
        totalSpan.id = 'cost-total-label';
        totalSpan.style.cssText = `
            cursor: help;
            text-decoration: underline dotted;
            text-decoration-color: rgba(148, 163, 184, 0.5);
            position: relative;
            z-index: 51;
        `;
        totalSpan.innerHTML = `Total: ${totalAmount}`;
        
        // Add tooltip to total label
        const tooltipContent = buildStackCostTooltip();
        totalSpan.setAttribute('data-tooltip-content', tooltipContent);
        totalSpan.addEventListener('mouseenter', function() { showCostTooltip(this); });
        totalSpan.addEventListener('mouseleave', function() { hideCostTooltip(); });
        
        banner.appendChild(totalSpan);
        
        // Add separator and remaining cost items if there are any
        if (remainingCosts.trim()) {
            const separatorSpan = document.createElement('span');
            separatorSpan.textContent = ' || ';
            separatorSpan.style.position = 'relative';
            separatorSpan.style.zIndex = '51';
            banner.appendChild(separatorSpan);
            
            const costItemsSpan = document.createElement('span');
            costItemsSpan.innerHTML = remainingCosts;
            costItemsSpan.style.position = 'relative';
            costItemsSpan.style.zIndex = '51';
            banner.appendChild(costItemsSpan);
        }
        
        container.insertBefore(banner, container.firstChild);
        
        // Attach tooltips to individual cost buckets (after banner is in DOM)
        const aggregated = aggregateStackCosts(project.layers);
        const consolidated = consolidateVariableCosts(aggregated);
        
        // Filter to only variable costs with buckets
        const variableBuckets = consolidated.filter(c => c.type === 'variable' && c.isBucket);
        
        variableBuckets.forEach((comp, varIdx) => {
            // Build tooltip for this specific bucket
            let bucketTooltip = `<div style="font-weight: 500; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px;">${comp.unit.charAt(0).toUpperCase() + comp.unit.slice(1)} Costs:</div>`;
            
            // Sort contributors by amount descending
            const sortedContributors = [...comp.contributors].sort((a, b) => b.amount - a.amount);
            
            sortedContributors.forEach(contrib => {
                const currency = contrib.currency || 'USD';
                const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
                
                const layerName = contrib.source || 'Unknown';
                const unit = contrib.unit || '';
                bucketTooltip += `<div style="margin-bottom: 4px; color: #cbd5e1; font-size: 11px;">• ${layerName}: ${symbol}${contrib.amount} ${unit}</div>`;
            });
            
            // Find the bucket span and attach tooltip using the variable-specific ID
            const bucketId = `cost-bucket-var-${varIdx}`;
            const bucketSpan = document.getElementById(bucketId);
            if (bucketSpan) {
                bucketSpan.setAttribute('data-tooltip-content', bucketTooltip);
                bucketSpan.style.cursor = 'help';
                bucketSpan.addEventListener('mouseenter', function(e) { 
                    e.stopPropagation();
                    showCostTooltip(this); 
                });
                bucketSpan.addEventListener('mouseleave', function() { hideCostTooltip(); });
            }
        });
        console.log('[BANNER] Banner creation complete');
    }
    
    // Helper function to format cost display
    const formatCostBadge = (layer) => {
        // Get all cost components for this layer and its substacks
        const components = !inSubstack ? getLayerCostComponents(layer) : 
            (layer.costModel ? getLayerCostComponents({ costModel: layer.costModel, substacks: [] }) : []);
        
        if (components.length === 0) {
            return 'Free';
        }
        
        // Group costs by period to avoid clutter
        const groupedComponents = groupCostsByPeriod(components);
        
        // Format all components with pipe delimiter
        const costText = groupedComponents.map(comp => formatCostComponent(comp)).join(' | ');
        
        return costText;
    };
    
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
        
        // Determine if this layer is selected (used for hover effects)
        const isSelected = index === currentIndex;
        
        const hasSubstacks = !inSubstack && layer.substacks && layer.substacks.length > 0;
        const substackPreview = hasSubstacks ? `
            <span style="font-size: 12px; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px; cursor: ${isSelected ? 'pointer' : 'default'}; transition: background 0.2s; pointer-events: ${isSelected ? 'auto' : 'none'};" 
                  onmouseover="${isSelected ? "this.style.background='rgba(255,255,255,0.2)'" : ''}" 
                  onmouseout="${isSelected ? "this.style.background='rgba(255,255,255,0.1)'" : ''}"
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
        
        // Create cost badge as a separate element with pointer-events: auto
        // Fades in/out with label, allows natural wrapping for long strings
        const costBadge = document.createElement('span');
        costBadge.id = `cost-badge-${layer.id}`;
        
        // Only enable pointer-events and cursor for selected badge
        const pointerEvents = isSelected ? 'auto' : 'none';
        const cursor = isSelected ? 'help' : 'default';
        
        costBadge.style.cssText = `
            position: absolute;
            left: 250px;
            top: 85px;
            font-size: 11px;
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
            padding: 4px 6px;
            border-radius: 3px;
            pointer-events: ${pointerEvents};
            cursor: ${cursor};
            display: inline-block;
            line-height: 1.5;
            white-space: nowrap;
            opacity: ${isSelected ? '1' : '0'};
            transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        // Replace pipes with line breaks for clean display
        const costText = formatCostBadge(layer);
        costBadge.innerHTML = costText.replace(/ \| /g, '<br>');
        
        // Attach tooltip event listeners to cost badge ONLY if selected and has substacks
        if (!inSubstack && isSelected && layer.substacks && layer.substacks.length > 0) {
            const components = getLayerCostComponents(layer);
            if (components.length > 0) {
                const groupedComponents = groupCostsByPeriod(components);
                const totalCost = calculateTotalLayerCost(layer);
                
                // Apply color coding
                let bgColor = 'rgba(16, 185, 129, 0.2)'; // green
                let textColor = '#10b981';
                if (totalCost > 500) {
                    bgColor = 'rgba(239, 68, 68, 0.2)'; // red
                    textColor = '#ef4444';
                } else if (totalCost > 200) {
                    bgColor = 'rgba(245, 158, 11, 0.2)'; // yellow
                    textColor = '#f59e0b';
                }
                costBadge.style.background = bgColor;
                costBadge.style.color = textColor;
                
                // Build tooltip content - only line breaks between items
                let tooltipContent = '<div style="font-weight: 500; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 6px;">Cost Breakdown:</div>';
                
                // Layer's own costs
                if (layer.costModel && (layer.costModel.fixedCost > 0 || layer.costModel.variableCost > 0)) {
                    tooltipContent += `<div style="margin-bottom: 4px;"><strong>${layer.name}</strong>`;
                    if (layer.costModel.fixedCost > 0) {
                        const symbol = layer.costModel.currency === 'USD' ? '$' : layer.costModel.currency === 'EUR' ? '€' : layer.costModel.currency === 'GBP' ? '£' : layer.costModel.currency;
                        const period = layer.costModel.period === 'month' ? '/mo' : layer.costModel.period === 'year' ? '/yr' : `/${layer.costModel.period}`;
                        tooltipContent += `<div style="margin-left: 12px; color: #cbd5e1; font-size: 12px; white-space: nowrap;">Fixed: ${symbol}${layer.costModel.fixedCost}${period}</div>`;
                    }
                    if (layer.costModel.variableCost > 0) {
                        const symbol = layer.costModel.currency === 'USD' ? '$' : layer.costModel.currency === 'EUR' ? '€' : layer.costModel.currency === 'GBP' ? '£' : layer.costModel.currency;
                        tooltipContent += `<div style="margin-left: 12px; color: #cbd5e1; font-size: 12px; white-space: nowrap;">Variable: ${symbol}${layer.costModel.variableCost} ${layer.costModel.variableUnit}</div>`;
                    }
                    tooltipContent += '</div>';
                }
                
                // Substack costs
                layer.substacks.forEach(substack => {
                    if (substack.costModel && (substack.costModel.fixedCost > 0 || substack.costModel.variableCost > 0)) {
                        tooltipContent += `<div style="margin-bottom: 4px;"><strong style="color: #e2e8f0;">${substack.name}</strong>`;
                        if (substack.costModel.fixedCost > 0) {
                            const symbol = substack.costModel.currency === 'USD' ? '$' : substack.costModel.currency === 'EUR' ? '€' : substack.costModel.currency === 'GBP' ? '£' : substack.costModel.currency;
                            const period = substack.costModel.period === 'month' ? '/mo' : substack.costModel.period === 'year' ? '/yr' : `/${substack.costModel.period}`;
                            tooltipContent += `<div style="margin-left: 12px; color: #cbd5e1; font-size: 12px; white-space: nowrap;">Fixed: ${symbol}${substack.costModel.fixedCost}${period}</div>`;
                        }
                        if (substack.costModel.variableCost > 0) {
                            const symbol = substack.costModel.currency === 'USD' ? '$' : substack.costModel.currency === 'EUR' ? '€' : substack.costModel.currency === 'GBP' ? '£' : substack.costModel.currency;
                            tooltipContent += `<div style="margin-left: 12px; color: #cbd5e1; font-size: 12px; white-space: nowrap;">Variable: ${symbol}${substack.costModel.variableCost} ${substack.costModel.variableUnit}</div>`;
                        }
                        tooltipContent += '</div>';
                    }
                });
                
                costBadge.setAttribute('data-tooltip-content', tooltipContent);
                
                costBadge.addEventListener('mouseenter', function() { showCostTooltip(this); });
                costBadge.addEventListener('mouseleave', function() { hideCostTooltip(); });
            }
        }
        
        card.appendChild(costBadge);
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
            
            // Toggle badge opacity to match label fade
            const badge = card.querySelector('[id^="cost-badge-"]');
            if (badge) {
                badge.style.opacity = i === index ? '1' : '0';
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
            
            // Toggle badge opacity to match label fade
            const badge = card.querySelector('[id^="cost-badge-"]');
            if (badge) {
                badge.style.opacity = i === index ? '1' : '0';
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
                            <div class="detail-label">Fixed Cost</div>
                            <input type="number" class="detail-input" step="0.01" value="${layer.costModel?.fixedCost || 0}" 
                                   onchange="updateCostField('fixedCost', parseFloat(this.value))">
                        </div>
                        
                        <div class="detail-section" style="margin-bottom: 0;">
                            <div class="detail-label">Variable Cost</div>
                            <input type="number" class="detail-input" step="0.00001" value="${layer.costModel?.variableCost || 0}" 
                                   onchange="updateCostField('variableCost', parseFloat(this.value))">
                        </div>
                    </div>
                    
                    <div class="detail-section" style="margin-bottom: 0;">
                        <div class="detail-label">Variable Unit</div>
                        <input type="text" class="detail-input" value="${layer.costModel?.variableUnit || ''}" 
                               placeholder="e.g., per 1M requests, per GB, per hour"
                               onchange="updateCostField('variableUnit', this.value)">
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

function toggleConnection(targetId, isConnected, connectionType = 'HTTP') {
    const currentLayer = inSubstack 
        ? project.layers[selectedLayerIndex].substacks[selectedSubstackIndex]
        : project.layers[selectedLayerIndex];
    
    // Ensure targetId is a number if it's a main layer, or string if it's a substack
    const allLayers = getAllLayers();
    const targetLayer = allLayers.find(l => l.id == targetId);
    if (targetLayer) {
        targetId = targetLayer.id; // Use the actual ID type from the layer
    }
    
    if (!currentLayer.connections) {
        currentLayer.connections = [];
    }
    
    // Normalize connections to object format
    currentLayer.connections = currentLayer.connections.map(c => 
        typeof c === 'object' ? c : { targetId: c, type: 'HTTP' }
    );
    
    saveState();
    
    if (isConnected) {
        // Check if connection already exists (compare with proper type)
        const existingConnection = currentLayer.connections.find(c => c.targetId == targetId);
        if (!existingConnection) {
            currentLayer.connections.push({ targetId, type: connectionType });
        }
    } else {
        currentLayer.connections = currentLayer.connections.filter(c => c.targetId != targetId);
    }
    
    saveProject();
    
    // Enable/disable the type dropdown
    const typeSelect = document.getElementById(`type-${targetId}`);
    if (typeSelect) {
        typeSelect.disabled = !isConnected;
    }
    
    if (currentView === 'diagram') {
        renderDiagram();
    }
}

function updateConnectionType(targetId, newType) {
    const currentLayer = inSubstack 
        ? project.layers[selectedLayerIndex].substacks[selectedSubstackIndex]
        : project.layers[selectedLayerIndex];
    
    // Ensure targetId is a number if it's a main layer, or string if it's a substack
    const allLayers = getAllLayers();
    const targetLayer = allLayers.find(l => l.id == targetId);
    if (targetLayer) {
        targetId = targetLayer.id; // Use the actual ID type from the layer
    }
    
    if (!currentLayer.connections) {
        return;
    }
    
    // Normalize connections to object format
    currentLayer.connections = currentLayer.connections.map(c => 
        typeof c === 'object' ? c : { targetId: c, type: 'HTTP' }
    );
    
    saveState();
    
    const connectionIndex = currentLayer.connections.findIndex(c => c.targetId == targetId);
    
    if (connectionIndex !== -1) {
        currentLayer.connections[connectionIndex].type = newType;
    }
    
    saveProject();
    
    // Re-render diagram to reflect changes
    if (currentView === 'diagram') {
        renderDiagram();
    }
    
    // Update the type selector to reflect the change without re-rendering entire panel
    const typeSelect = document.getElementById(`type-${targetId}`);
    if (typeSelect) {
        typeSelect.value = newType;
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

function updateCostField(field, value) {
    saveState();
    
    const currentLayer = inSubstack 
        ? project.layers[selectedLayerIndex].substacks[selectedSubstackIndex]
        : project.layers[selectedLayerIndex];
    
    // Initialize costModel if it doesn't exist
    if (!currentLayer.costModel) {
        currentLayer.costModel = JSON.parse(JSON.stringify(DEFAULT_COST_MODEL));
    }
    
    currentLayer.costModel[field] = value;
    saveProject();
    
    // Update cost badge in stack view without re-rendering entire details panel
    const currentIndex = inSubstack ? selectedSubstackIndex : selectedLayerIndex;
    const layers = inSubstack && project.layers[selectedLayerIndex].substacks 
        ? project.layers[selectedLayerIndex].substacks 
        : project.layers;
    
    // Update the cost badge text for the current layer
    const costBadgeId = `cost-badge-${currentLayer.id}`;
    const costBadge = document.getElementById(costBadgeId);
    if (costBadge) {
        // Recalculate cost display
        const components = !inSubstack ? getLayerCostComponents(currentLayer) : 
            (currentLayer.costModel ? getLayerCostComponents({ costModel: currentLayer.costModel, substacks: [] }) : []);
        
        if (components.length === 0) {
            costBadge.textContent = 'Free';
        } else {
            const groupedComponents = groupCostsByPeriod(components);
            const costText = groupedComponents.map(comp => formatCostComponent(comp)).join(' | ');
            // Replace pipes with line breaks for clean display
            costBadge.innerHTML = costText.replace(/ \| /g, '<br>');
        }
        
        // Update color coding
        const totalCost = calculateTotalLayerCost(currentLayer);
        let bgColor = 'rgba(16, 185, 129, 0.2)'; // green
        let textColor = '#10b981';
        if (totalCost > 500) {
            bgColor = 'rgba(239, 68, 68, 0.2)'; // red
            textColor = '#ef4444';
        } else if (totalCost > 200) {
            bgColor = 'rgba(245, 158, 11, 0.2)'; // yellow
            textColor = '#f59e0b';
        }
        costBadge.style.background = bgColor;
        costBadge.style.color = textColor;
    }
    
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

function showCostTooltip(element) {
    // Remove any existing tooltip
    hideCostTooltip();
    
    const tooltipContent = element.getAttribute('data-tooltip-content');
    if (!tooltipContent) {
        console.log('[COST TOOLTIP] No tooltip content found');
        return;
    }
    
    console.log('[COST TOOLTIP] Creating tooltip element');
    
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.id = 'cost-tooltip';
    tooltip.innerHTML = tooltipContent;
    tooltip.style.cssText = `
        position: fixed;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 6px;
        padding: 12px 16px;
        font-size: 12px;
        color: #e2e8f0;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        max-width: 90vw;
        max-height: 80vh;
        overflow: auto;
        pointer-events: none;
        white-space: nowrap;
    `;
    
    document.body.appendChild(tooltip);
    console.log('[COST TOOLTIP] Tooltip element added to DOM');
    
    // Position tooltip near the element, accounting for viewport
    const rect = element.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
    let top = rect.bottom + 8;
    
    // Adjust if tooltip goes off-screen
    if (left + tooltip.offsetWidth > window.innerWidth) {
        left = window.innerWidth - tooltip.offsetWidth - 8;
    }
    if (left < 0) {
        left = 8;
    }
    if (top + tooltip.offsetHeight > window.innerHeight) {
        top = rect.top - tooltip.offsetHeight - 8;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    
    console.log(`[COST TOOLTIP] Positioned at: left=${tooltip.style.left}, top=${tooltip.style.top}`);
}

function hideCostTooltip() {
    const tooltip = document.getElementById('cost-tooltip');
    if (tooltip) {
        console.log('[COST TOOLTIP] Removing tooltip element');
        tooltip.remove();
    }
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

function loadTemplate(templateName) {
    if (confirm('Load template? Unsaved changes will be lost.')) {
        const template = TEMPLATES[templateName];
        if (template) {
            project = JSON.parse(JSON.stringify(template));
            // Migrate template data to new format
            project = migrateProject(project);
            document.getElementById('project-title').textContent = project.name;
            saveProject();
            renderLayers();
            updateStats();
            selectLayer(0);
        } else {
            alert('Template not found: ' + templateName);
        }
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
    
    // Handle submenu triggers (Templates)
    document.querySelectorAll('.submenu-trigger').forEach(trigger => {
        const submenu = trigger.querySelector('.submenu');
        
        if (submenu) {
            trigger.addEventListener('mouseenter', () => {
                submenu.style.display = 'block';
            });
            
            trigger.addEventListener('mouseleave', () => {
                submenu.style.display = 'none';
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


// ============================================================================
// ACTIONS VIEW FUNCTIONS
// ============================================================================

/**
 * Render the actions view
 */
function renderActionsView() {
    const container = document.getElementById('actions-view');
    container.innerHTML = '';
    
    // Header with buttons
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
        padding-bottom: 16px;
        border-bottom: 2px solid #334155;
        flex-wrap: wrap;
        gap: 12px;
    `;
    
    const title = document.createElement('h2');
    title.textContent = 'Actions & Flows';
    title.style.cssText = `
        margin: 0;
        color: #e2e8f0;
        font-size: 20px;
        font-weight: 700;
        letter-spacing: -0.5px;
        flex: 1;
    `;
    
    const buttonGroup = document.createElement('div');
    buttonGroup.style.cssText = `
        display: flex;
        gap: 8px;
    `;
    
    const importBtn = document.createElement('button');
    importBtn.textContent = '⚡ Import from Connections';
    importBtn.style.cssText = `
        background: #8b5cf6;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s;
    `;
    importBtn.onmouseover = () => importBtn.style.background = '#7c3aed';
    importBtn.onmouseout = () => importBtn.style.background = '#8b5cf6';
    importBtn.onclick = () => importActionsFromConnections();
    
    const addBtn = document.createElement('button');
    addBtn.textContent = '+ New Action';
    addBtn.style.cssText = `
        background: #3b82f6;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s;
    `;
    addBtn.onmouseover = () => addBtn.style.background = '#2563eb';
    addBtn.onmouseout = () => addBtn.style.background = '#3b82f6';
    addBtn.onclick = () => createNewAction();
    
    buttonGroup.appendChild(importBtn);
    buttonGroup.appendChild(addBtn);
    header.appendChild(title);
    header.appendChild(buttonGroup);
    container.appendChild(header);
    
    // Actions list
    if (!project.usePaths || project.usePaths.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = `
            text-align: center;
            color: #64748b;
            padding: 60px 20px;
        `;
        empty.innerHTML = `
            <div style="font-size: 15px; margin-bottom: 12px; color: #94a3b8;">No actions defined yet</div>
            <div style="font-size: 13px; line-height: 1.6;">Click <strong>"New Action"</strong> to create your first user journey<br>or <strong>"Import from Connections"</strong> to auto-generate from your diagram</div>
        `;
        container.appendChild(empty);
        return;
    }
    
    // Separate actions and paths
    const actions = project.usePaths.filter(p => p.layersInvolved.length === 1);
    const paths = project.usePaths.filter(p => p.layersInvolved.length > 1);
    
    // Sort both by name
    actions.sort((a, b) => a.name.localeCompare(b.name));
    paths.sort((a, b) => a.name.localeCompare(b.name));
    
    // Helper function to create section header
    function createSectionHeader(title, count, isCollapsed, toggleCallback) {
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            padding: 12px 0;
            user-select: none;
            transition: all 0.2s;
            margin-bottom: 16px;
        `;
        
        const toggleIcon = document.createElement('span');
        toggleIcon.textContent = '▼';
        toggleIcon.style.cssText = `
            color: #94a3b8;
            font-size: 11px;
            font-weight: 600;
            transition: transform 0.2s;
            transform: ${isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'};
            display: flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
        `;
        
        const titleSpan = document.createElement('span');
        titleSpan.textContent = title;
        titleSpan.style.cssText = `
            color: #e2e8f0;
            font-weight: 600;
            font-size: 14px;
            letter-spacing: 0.3px;
            flex: 1;
        `;
        
        const countBadge = document.createElement('span');
        countBadge.textContent = count;
        countBadge.style.cssText = `
            background: #334155;
            color: #cbd5e1;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            min-width: 24px;
            text-align: center;
        `;
        
        header.appendChild(toggleIcon);
        header.appendChild(titleSpan);
        header.appendChild(countBadge);
        
        header.onclick = toggleCallback;
        
        return { header, toggleIcon };
    }
    
    // Render Actions section (collapsible)
    if (actions.length > 0) {
        const actionsSection = document.createElement('div');
        actionsSection.style.cssText = `
            margin-bottom: 40px;
        `;
        
        const { header: actionsHeader, toggleIcon: actionsToggle } = createSectionHeader(
            'Single Actions',
            actions.length,
            actionsViewCollapsed,
            () => {
                actionsViewCollapsed = !actionsViewCollapsed;
                actionsContainer.style.display = actionsViewCollapsed ? 'none' : 'grid';
                actionsToggle.style.transform = actionsViewCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
            }
        );
        
        const actionsContainer = document.createElement('div');
        actionsContainer.style.cssText = `
            display: ${actionsViewCollapsed ? 'none' : 'grid'};
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 16px;
            animation: fadeIn 0.3s ease;
        `;
        
        // Render action cards
        actions.forEach(action => {
            const actionCard = createActionCard(action);
            actionsContainer.appendChild(actionCard);
        });
        
        actionsSection.appendChild(actionsHeader);
        actionsSection.appendChild(actionsContainer);
        container.appendChild(actionsSection);
    }
    
    // Render Paths section (collapsible)
    if (paths.length > 0) {
        const pathsSection = document.createElement('div');
        pathsSection.style.cssText = `
            margin-bottom: 40px;
        `;
        
        const { header: pathsHeader, toggleIcon: pathsToggle } = createSectionHeader(
            'Multi-Step Flows',
            paths.length,
            pathsViewCollapsed,
            () => {
                pathsViewCollapsed = !pathsViewCollapsed;
                pathsContainer.style.display = pathsViewCollapsed ? 'none' : 'grid';
                pathsToggle.style.transform = pathsViewCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
            }
        );
        
        const pathsContainer = document.createElement('div');
        pathsContainer.style.cssText = `
            display: ${pathsViewCollapsed ? 'none' : 'grid'};
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 16px;
            animation: fadeIn 0.3s ease;
        `;
        
        // Render path cards
        paths.forEach(path => {
            const pathCard = createActionCard(path);
            pathsContainer.appendChild(pathCard);
        });
        
        pathsSection.appendChild(pathsHeader);
        pathsSection.appendChild(pathsContainer);
        container.appendChild(pathsSection);
    }
}

/**
 * Create an action/path card
 */
function createActionCard(path) {
    const actionCard = document.createElement('div');
    const isSelected = selectedActionId === path.id;
    
    actionCard.style.cssText = `
        background: ${isSelected ? '#1e293b' : '#0f172a'};
        border: 2px solid ${isSelected ? '#3b82f6' : '#334155'};
        border-radius: 8px;
        padding: 14px 16px;
        cursor: pointer;
        transition: all 0.2s;
    `;
    actionCard.onmouseover = () => {
        if (!isSelected) {
            actionCard.style.background = '#1e293b';
            actionCard.style.borderColor = '#475569';
        }
    };
    actionCard.onmouseout = () => {
        if (!isSelected) {
            actionCard.style.background = '#0f172a';
            actionCard.style.borderColor = '#334155';
        }
    };
    
    // Action name and description
    const nameDiv = document.createElement('div');
    nameDiv.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 10px;
        gap: 12px;
    `;
    
    const nameSpan = document.createElement('div');
    nameSpan.style.cssText = `
        flex: 1;
    `;
    nameSpan.innerHTML = `
        <div style="color: #e2e8f0; font-weight: 600; font-size: 13px; letter-spacing: 0.2px;">${path.name}</div>
        <div style="color: #94a3b8; font-size: 12px; margin-top: 4px; line-height: 1.4;">${path.description || '<em style="color: #64748b;">No description</em>'}</div>
    `;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✕';
    deleteBtn.style.cssText = `
        background: #ef4444;
        color: white;
        border: none;
        width: 28px;
        height: 28px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.2s;
        flex-shrink: 0;
    `;
    deleteBtn.onmouseover = () => deleteBtn.style.background = '#dc2626';
    deleteBtn.onmouseout = () => deleteBtn.style.background = '#ef4444';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteAction(path.id);
    };
    
    nameDiv.appendChild(nameSpan);
    nameDiv.appendChild(deleteBtn);
    
    // Path visualization
    const pathDiv = document.createElement('div');
    pathDiv.style.cssText = `
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid #334155;
        border-radius: 6px;
        padding: 10px 12px;
        font-size: 12px;
        color: #cbd5e1;
        line-height: 1.5;
    `;
    
    const pathLayers = path.layersInvolved.map(layerId => {
        const layer = getAllLayers().find(l => l.id === layerId);
        return layer ? layer.name : `Layer ${layerId}`;
    });
    
    pathDiv.innerHTML = `
        <div style="margin-bottom: 6px; color: #94a3b8; font-size: 11px; font-weight: 600; letter-spacing: 0.3px; text-transform: uppercase;">Path</div>
        <div style="color: #cbd5e1;">${pathLayers.length > 0 ? pathLayers.join(' → ') : '<em style="color: #64748b;">No path defined</em>'}</div>
    `;
    
    actionCard.appendChild(nameDiv);
    actionCard.appendChild(pathDiv);
    
    // Click to select action
    actionCard.onclick = () => {
        selectedActionId = path.id;
        renderActionsView();
        renderActionAssemblyPanel(path);
    };
    
    return actionCard;
}

/**
 * Create a new action with blank slate
 */
function createNewAction() {
    saveState();
    
    // Create blank action with default values
    const actionIndex = (project.usePaths?.length || 0) + 1;
    const newAction = {
        id: `action-${actionIndex}`,
        name: 'New Action',
        description: '',
        layersInvolved: [],
        avgCallsPerLayer: {},
        notes: ''
    };
    
    if (!project.usePaths) {
        project.usePaths = [];
    }
    
    project.usePaths.push(newAction);
    saveProject();
    
    // Select the new action and show assembly panel
    selectedActionId = newAction.id;
    renderActionsView();
    renderActionAssemblyPanel(newAction);
}

/**
 * Edit an action
 */
function editAction(pathId) {
    const path = project.usePaths.find(p => p.id === pathId);
    if (!path) return;
    
    selectedActionId = pathId;
    renderActionsView();
    renderActionAssemblyPanel(path);
}

/**
 * Delete an action
 */
function deleteAction(pathId) {
    const path = project.usePaths.find(p => p.id === pathId);
    if (!path) return;
    
    if (!confirm(`Delete action "${path.name}"?`)) return;
    
    saveState();
    project.usePaths = project.usePaths.filter(p => p.id !== pathId);
    saveProject();
    selectedActionId = null;
    renderActionsView();
}

/**
 * Render the action assembly panel in the details frame
 */
function renderActionAssemblyPanel(path) {
    const detailsDiv = document.getElementById('layer-details');
    const allLayers = getAllLayers();
    
    detailsDiv.innerHTML = `
        <div style="display: flex; flex-direction: column; height: 100%; gap: 0;">
            <!-- Header - Editable -->
            <div style="padding-bottom: 16px; border-bottom: 1px solid #334155; margin-bottom: 16px; flex-shrink: 0;">
                <input type="text" id="action-name-input" value="${path.name}" 
                       style="width: 100%; background: #1e293b; border: 1px solid #334155; color: #e2e8f0; 
                              padding: 8px 12px; border-radius: 4px; font-size: 14px; font-weight: 600; 
                              margin-bottom: 8px; box-sizing: border-box;"
                       onchange="updateActionName('${path.id}', this.value)">
                <textarea id="action-desc-input" placeholder="Add description..." 
                          style="width: 100%; background: #1e293b; border: 1px solid #334155; color: #e2e8f0; 
                                 padding: 8px 12px; border-radius: 4px; font-size: 12px; 
                                 resize: vertical; min-height: 50px; box-sizing: border-box;"
                          onchange="updateActionDescription('${path.id}', this.value)">${path.description || ''}</textarea>
            </div>
            
            <!-- Search Box -->
            <div style="margin-bottom: 16px; flex-shrink: 0;">
                <input type="text" id="assembly-search" placeholder="Search layers..." 
                       style="width: 100%; background: #1e293b; border: 1px solid #334155; color: #e2e8f0; 
                              padding: 8px 12px; border-radius: 4px; font-size: 12px; box-sizing: border-box;"
                       onkeyup="filterAssemblyLayers()">
            </div>
            
            <!-- Available Layers -->
            <div style="margin-bottom: 16px; flex-shrink: 0;">
                <div style="color: #94a3b8; font-size: 11px; margin-bottom: 8px; font-weight: 500;">
                    Available Layers
                </div>
                <div id="assembly-layers" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 150px; overflow-y: auto;">
                    <!-- Layers will be populated here -->
                </div>
            </div>
            
            <!-- Current Path -->
            <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; margin-bottom: 16px;">
                <div style="color: #94a3b8; font-size: 11px; margin-bottom: 8px; font-weight: 500;">
                    Action Path (${path.layersInvolved.length} steps)
                </div>
                <div id="assembly-path" style="flex: 1; background: #0f172a; border: 1px solid #334155; border-radius: 4px; 
                                               padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
                    <!-- Path steps will be populated here -->
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div style="display: flex; gap: 8px; flex-shrink: 0; padding-top: 16px; border-top: 1px solid #334155;">
                <button onclick="saveActionPath()" style="flex: 1; background: #10b981; color: white; border: none; 
                                                          padding: 8px 16px; border-radius: 4px; cursor: pointer; 
                                                          font-size: 12px; font-weight: 500; transition: background 0.2s;"
                        onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
                    Save
                </button>
                <button onclick="clearActionSelection()" style="flex: 1; background: #64748b; color: white; border: none; 
                                                                padding: 8px 16px; border-radius: 4px; cursor: pointer; 
                                                                font-size: 12px; font-weight: 500; transition: background 0.2s;"
                        onmouseover="this.style.background='#475569'" onmouseout="this.style.background='#64748b'">
                    Close
                </button>
            </div>
        </div>
    `;
    
    // Populate available layers
    populateAssemblyLayers(path, allLayers);
    
    // Populate current path
    populateAssemblyPath(path);
}

/**
 * Update action name
 */
function updateActionName(actionId, newName) {
    const action = project.usePaths.find(p => p.id === actionId);
    if (action && newName.trim()) {
        action.name = newName.trim();
        saveProject();
    }
}

/**
 * Update action description
 */
function updateActionDescription(actionId, newDescription) {
    const action = project.usePaths.find(p => p.id === actionId);
    if (action) {
        action.description = newDescription.trim();
        saveProject();
    }
}

/**
 * Populate the available layers list in the assembly panel
 */
function populateAssemblyLayers(path, allLayers) {
    const container = document.getElementById('assembly-layers');
    if (!container) return;
    
    container.innerHTML = '';
    
    allLayers.forEach(layer => {
        const isInPath = path.layersInvolved.includes(layer.id);
        
        const layerBtn = document.createElement('button');
        layerBtn.className = 'assembly-layer-btn';
        layerBtn.dataset.layerId = layer.id;
        layerBtn.style.cssText = `
            background: ${isInPath ? '#3b82f6' : '#1e293b'};
            color: ${isInPath ? 'white' : '#cbd5e1'};
            border: 1px solid ${isInPath ? '#2563eb' : '#334155'};
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
            text-align: left;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
        
        layerBtn.textContent = layer.name;
        
        layerBtn.onmouseover = () => {
            if (!isInPath) {
                layerBtn.style.background = '#334155';
                layerBtn.style.borderColor = '#475569';
            }
        };
        
        layerBtn.onmouseout = () => {
            if (!isInPath) {
                layerBtn.style.background = '#1e293b';
                layerBtn.style.borderColor = '#334155';
            }
        };
        
        layerBtn.onclick = () => {
            addLayerToPath(path, layer.id);
        };
        
        container.appendChild(layerBtn);
    });
}

/**
 * Populate the current path visualization in the assembly panel
 */
function populateAssemblyPath(path) {
    const container = document.getElementById('assembly-path');
    if (!container) return;
    
    if (path.layersInvolved.length === 0) {
        container.innerHTML = '<div style="color: #64748b; font-size: 12px; text-align: center; padding: 20px;">Click layers to add them to the path</div>';
        return;
    }
    
    container.innerHTML = '';
    
    path.layersInvolved.forEach((layerId, index) => {
        const layer = getAllLayers().find(l => l.id === layerId);
        const layerName = layer ? layer.name : `Layer ${layerId}`;
        const calls = path.avgCallsPerLayer[layerId] || 1;
        
        const stepDiv = document.createElement('div');
        stepDiv.style.cssText = `
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 4px;
            padding: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        `;
        
        const stepInfo = document.createElement('div');
        stepInfo.style.cssText = `
            flex: 1;
            min-width: 0;
        `;
        
        stepInfo.innerHTML = `
            <div style="color: #e2e8f0; font-size: 12px; font-weight: 500; margin-bottom: 4px;">
                ${index + 1}. ${layerName}
            </div>
            <div style="color: #94a3b8; font-size: 11px;">
                Calls: <input type="number" value="${calls}" min="1" style="width: 40px; background: #0f172a; 
                             border: 1px solid #334155; color: #e2e8f0; padding: 4px; border-radius: 3px; font-size: 11px;"
                       onchange="updateLayerCalls('${path.id}', ${layerId}, this.value)">
            </div>
        `;
        
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '✕';
        removeBtn.style.cssText = `
            background: #ef4444;
            color: white;
            border: none;
            width: 24px;
            height: 24px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            transition: background 0.2s;
            flex-shrink: 0;
        `;
        
        removeBtn.onmouseover = () => removeBtn.style.background = '#dc2626';
        removeBtn.onmouseout = () => removeBtn.style.background = '#ef4444';
        removeBtn.onclick = () => removeLayerFromPath(path, layerId);
        
        stepDiv.appendChild(stepInfo);
        stepDiv.appendChild(removeBtn);
        container.appendChild(stepDiv);
        
        // Add arrow between steps
        if (index < path.layersInvolved.length - 1) {
            const arrow = document.createElement('div');
            arrow.style.cssText = `
                text-align: center;
                color: #64748b;
                font-size: 12px;
                padding: 4px 0;
            `;
            arrow.textContent = '↓';
            container.appendChild(arrow);
        }
    });
}

/**
 * Add a layer to the action path
 */
function addLayerToPath(path, layerId) {
    if (!path.layersInvolved.includes(layerId)) {
        path.layersInvolved.push(layerId);
        path.avgCallsPerLayer[layerId] = 1;
        populateAssemblyLayers(path, getAllLayers());
        populateAssemblyPath(path);
    }
}

/**
 * Remove a layer from the action path
 */
function removeLayerFromPath(path, layerId) {
    path.layersInvolved = path.layersInvolved.filter(id => id !== layerId);
    delete path.avgCallsPerLayer[layerId];
    populateAssemblyLayers(path, getAllLayers());
    populateAssemblyPath(path);
}

/**
 * Update the call count for a layer in the path
 */
function updateLayerCalls(pathId, layerId, value) {
    const path = project.usePaths.find(p => p.id === pathId);
    if (path) {
        path.avgCallsPerLayer[layerId] = parseInt(value) || 1;
    }
}

/**
 * Filter assembly layers by search term
 */
function filterAssemblyLayers() {
    const searchInput = document.getElementById('assembly-search');
    const searchTerm = searchInput.value.toLowerCase();
    const layerBtns = document.querySelectorAll('.assembly-layer-btn');
    
    layerBtns.forEach(btn => {
        const layerName = btn.textContent.toLowerCase();
        btn.style.display = layerName.includes(searchTerm) ? 'block' : 'none';
    });
}

/**
 * Save the action path and close the assembly panel
 */
function saveActionPath() {
    saveState();
    saveProject();
    selectedActionId = null;
    renderActionsView();
    renderLayerDetails(project.layers[selectedLayerIndex]);
}

/**
 * Clear action selection and return to details panel
 */
function clearActionSelection() {
    selectedActionId = null;
    renderActionsView();
    renderLayerDetails(project.layers[selectedLayerIndex]);
}


// ============================================================================
// CONNECTION PATH ANALYSIS & ACTION GENERATION
// ============================================================================

/**
 * Generate action templates from all connection paths in the diagram
 * Analyzes the connection graph and creates actions for all possible paths
 */
function generateActionsFromConnections() {
    const allLayers = getAllLayers();
    const generatedActions = [];
    const visited = new Set();
    
    // Find all starting points (layers with no incoming connections)
    const startingLayers = allLayers.filter(layer => {
        const hasIncoming = allLayers.some(other => {
            const connections = other.connections || [];
            return connections.some(conn => {
                const connId = typeof conn === 'object' ? conn.targetId : conn;
                return connId === layer.id;
            });
        });
        return !hasIncoming;
    });
    
    // If no starting points found, use all layers as potential starts
    const starts = startingLayers.length > 0 ? startingLayers : allLayers;
    
    // Generate paths from each starting point
    starts.forEach(startLayer => {
        const paths = findAllPathsFrom(startLayer, allLayers, new Set(), []);
        paths.forEach(path => {
            const pathKey = path.map(l => l.id).join('->');
            if (!visited.has(pathKey)) {
                visited.add(pathKey);
                generatedActions.push(createActionFromPath(path));
            }
        });
    });
    
    return generatedActions;
}

/**
 * Find all possible paths starting from a given layer
 * Uses depth-first search to explore all connection paths
 */
function findAllPathsFrom(currentLayer, allLayers, visited, currentPath) {
    const paths = [];
    const newPath = [...currentPath, currentLayer];
    const newVisited = new Set(visited);
    newVisited.add(currentLayer.id);
    
    // Add current path as a valid path
    paths.push(newPath);
    
    // Explore connections
    const connections = currentLayer.connections || [];
    connections.forEach(conn => {
        const targetId = typeof conn === 'object' ? conn.targetId : conn;
        
        // Avoid cycles
        if (!newVisited.has(targetId)) {
            const targetLayer = allLayers.find(l => l.id === targetId);
            if (targetLayer) {
                const subPaths = findAllPathsFrom(targetLayer, allLayers, newVisited, newPath);
                paths.push(...subPaths);
            }
        }
    });
    
    return paths;
}

/**
 * Create an action from a path of layers
 */
function createActionFromPath(layerPath) {
    const layerNames = layerPath.map(l => l.name).join(' → ');
    const layerIds = layerPath.map(l => l.id);
    
    // Create action name from path
    const actionName = layerNames;
    
    // Create action ID from layer IDs
    const actionId = `path-${layerIds.join('-')}`;
    
    // Initialize call counts (1 per layer by default)
    const avgCallsPerLayer = {};
    layerIds.forEach(id => {
        avgCallsPerLayer[id] = 1;
    });
    
    return {
        id: actionId,
        name: actionName,
        description: `Auto-generated path: ${layerNames}`,
        layersInvolved: layerIds,
        avgCallsPerLayer: avgCallsPerLayer,
        notes: 'Generated from connection paths'
    };
}

/**
 * Import generated actions from connections
 * Shows a dialog to select which paths to import
 */
function importActionsFromConnections() {
    const generatedActions = generateActionsFromConnections();
    
    if (generatedActions.length === 0) {
        alert('No connection paths found. Create connections between layers first.');
        return;
    }
    
    // Count existing actions
    const existingCount = project.usePaths?.length || 0;
    
    // Ask user if they want to import
    const message = `Found ${generatedActions.length} possible paths through your stack.\n\nImport these as action templates?\n\nYou can edit them after import.`;
    
    if (!confirm(message)) {
        return;
    }
    
    saveState();
    
    // Add generated actions to project
    if (!project.usePaths) {
        project.usePaths = [];
    }
    
    // Filter out duplicates (by path)
    const existingPaths = new Set(project.usePaths.map(p => p.layersInvolved.join('->')));
    
    let importedCount = 0;
    generatedActions.forEach(action => {
        const pathKey = action.layersInvolved.join('->');
        if (!existingPaths.has(pathKey)) {
            project.usePaths.push(action);
            existingPaths.add(pathKey);
            importedCount++;
        }
    });
    
    saveProject();
    
    // Show result
    alert(`Imported ${importedCount} new action paths.\n\nTotal actions: ${project.usePaths.length}`);
    
    // Refresh actions view if visible
    if (currentView === 'actions') {
        renderActionsView();
    }
}

/**
 * Add import button to actions view header
 * This function is called from renderActionsView
 */
function addImportConnectionsButton(header) {
    const importBtn = document.createElement('button');
    importBtn.textContent = '⚡ Import from Connections';
    importBtn.style.cssText = `
        background: #8b5cf6;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: background 0.2s;
        margin-left: 8px;
    `;
    importBtn.onmouseover = () => importBtn.style.background = '#7c3aed';
    importBtn.onmouseout = () => importBtn.style.background = '#8b5cf6';
    importBtn.onclick = () => importActionsFromConnections();
    
    return importBtn;
}
