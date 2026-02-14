/**
 * ProjectValidator - Data integrity and validation service
 * Ensures all references remain valid and consistent across the project
 */

class ProjectValidator {
    /**
     * Validate all layer references in the project
     * @param {Object} project - The project to validate
     * @returns {Object} Validation result with isValid flag and errors array
     */
    validateLayerReferences(project) {
        const errors = [];
        
        if (!project || !project.layers) {
            return { isValid: true, errors: [] };
        }
        
        // Get all valid layer IDs (including substacks)
        const allLayerIds = this.getAllLayerIds(project);
        
        // Check each layer's connections
        project.layers.forEach((layer, layerIndex) => {
            this.validateLayerConnections(layer, allLayerIds, errors, `Layer ${layerIndex}: ${layer.name}`);
            
            // Check substacks
            if (layer.substacks && Array.isArray(layer.substacks)) {
                layer.substacks.forEach((substack, substackIndex) => {
                    this.validateLayerConnections(substack, allLayerIds, errors, `Layer ${layerIndex}: ${layer.name} > Substack ${substackIndex}: ${substack.name}`);
                });
            }
        });
        
        // Check use paths
        if (project.usePaths && Array.isArray(project.usePaths)) {
            project.usePaths.forEach((usePath, pathIndex) => {
                this.validateUsePath(usePath, allLayerIds, errors, `Use Path ${pathIndex}: ${usePath.name}`);
            });
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Validate connections for a single layer or substack
     */
    validateLayerConnections(layer, validIds, errors, context) {
        if (!layer.connections) return;
        
        // Handle both old format (objects) and new format (IDs)
        const connections = Array.isArray(layer.connections) ? layer.connections : [];
        
        connections.forEach((conn, index) => {
            let targetId;
            
            // Handle old format: {targetId, type}
            if (typeof conn === 'object' && conn !== null && conn.targetId !== undefined) {
                targetId = conn.targetId;
            }
            // Handle new format: just the ID
            else if (typeof conn === 'number' || typeof conn === 'string') {
                targetId = conn;
            }
            
            if (targetId !== undefined && !validIds.includes(targetId)) {
                errors.push({
                    type: 'orphaned-reference',
                    severity: 'critical',
                    context: context,
                    reference: conn,
                    message: `Connection references non-existent layer ID: ${targetId}`
                });
            }
        });
    }
    
    /**
     * Validate a use path
     */
    validateUsePath(usePath, validIds, errors, context) {
        if (!usePath.layersInvolved || !Array.isArray(usePath.layersInvolved)) {
            return;
        }
        
        usePath.layersInvolved.forEach((layerId, index) => {
            if (!validIds.includes(layerId)) {
                errors.push({
                    type: 'orphaned-reference',
                    severity: 'critical',
                    context: context,
                    reference: layerId,
                    message: `Use path references non-existent layer ID: ${layerId}`
                });
            }
        });
    }
    
    /**
     * Get all valid layer IDs in the project (including substacks)
     */
    getAllLayerIds(project) {
        const ids = [];
        
        if (!project.layers) return ids;
        
        project.layers.forEach(layer => {
            ids.push(layer.id);
            
            if (layer.substacks && Array.isArray(layer.substacks)) {
                layer.substacks.forEach(substack => {
                    ids.push(substack.id);
                });
            }
        });
        
        return ids;
    }
    
    /**
     * Get all references to a specific layer
     */
    getLayerReferences(project, layerId) {
        const references = {
            connections: [],
            usePaths: []
        };
        
        if (!project.layers) return references;
        
        // Check connections
        project.layers.forEach((layer, layerIndex) => {
            this.findConnectionReferences(layer, layerId, references.connections, `Layer ${layerIndex}: ${layer.name}`);
            
            if (layer.substacks && Array.isArray(layer.substacks)) {
                layer.substacks.forEach((substack, substackIndex) => {
                    this.findConnectionReferences(substack, layerId, references.connections, `Layer ${layerIndex}: ${layer.name} > Substack ${substackIndex}: ${substack.name}`);
                });
            }
        });
        
        // Check use paths
        if (project.usePaths && Array.isArray(project.usePaths)) {
            project.usePaths.forEach((usePath, pathIndex) => {
                if (usePath.layersInvolved && usePath.layersInvolved.includes(layerId)) {
                    references.usePaths.push({
                        id: usePath.id,
                        name: usePath.name,
                        index: pathIndex
                    });
                }
            });
        }
        
        return references;
    }
    
    /**
     * Find connection references to a specific layer
     */
    findConnectionReferences(layer, targetId, results, context) {
        if (!layer.connections) return;
        
        const connections = Array.isArray(layer.connections) ? layer.connections : [];
        
        connections.forEach((conn, index) => {
            let connTargetId;
            
            if (typeof conn === 'object' && conn !== null && conn.targetId !== undefined) {
                connTargetId = conn.targetId;
            } else if (typeof conn === 'number' || typeof conn === 'string') {
                connTargetId = conn;
            }
            
            if (connTargetId === targetId) {
                results.push({
                    context: context,
                    index: index,
                    connectionType: typeof conn === 'object' ? conn.type : 'HTTP'
                });
            }
        });
    }
    
    /**
     * Check if a layer can be safely deleted
     */
    canDeleteLayer(project, layerId) {
        const references = this.getLayerReferences(project, layerId);
        return references.connections.length === 0 && references.usePaths.length === 0;
    }
    
    /**
     * Remove orphaned references to a deleted layer
     */
    removeOrphanedReferences(project, layerId) {
        if (!project.layers) return;
        
        project.layers.forEach(layer => {
            this.removeConnectionReferences(layer, layerId);
            
            if (layer.substacks && Array.isArray(layer.substacks)) {
                layer.substacks.forEach(substack => {
                    this.removeConnectionReferences(substack, layerId);
                });
            }
        });
        
        // Remove from use paths
        if (project.usePaths && Array.isArray(project.usePaths)) {
            project.usePaths.forEach(usePath => {
                if (usePath.layersInvolved && Array.isArray(usePath.layersInvolved)) {
                    usePath.layersInvolved = usePath.layersInvolved.filter(id => id !== layerId);
                }
            });
        }
    }
    
    /**
     * Remove connection references to a specific layer
     */
    removeConnectionReferences(layer, targetId) {
        if (!layer.connections) return;
        
        // Filter out connections to the deleted layer
        layer.connections = layer.connections.filter(conn => {
            let connTargetId;
            
            if (typeof conn === 'object' && conn !== null && conn.targetId !== undefined) {
                connTargetId = conn.targetId;
            } else if (typeof conn === 'number' || typeof conn === 'string') {
                connTargetId = conn;
            }
            
            return connTargetId !== targetId;
        });
        
        // Also clean up connectionTypes if it exists
        if (layer.connectionTypes && typeof layer.connectionTypes === 'object') {
            delete layer.connectionTypes[targetId];
        }
    }
    
    /**
     * Repair a use path by removing invalid layer references
     */
    repairUsePath(usePath, validIds) {
        if (!usePath.layersInvolved || !Array.isArray(usePath.layersInvolved)) {
            return;
        }
        
        const originalLength = usePath.layersInvolved.length;
        usePath.layersInvolved = usePath.layersInvolved.filter(id => validIds.includes(id));
        
        // Also repair avgCallsPerLayer
        if (usePath.avgCallsPerLayer && typeof usePath.avgCallsPerLayer === 'object') {
            const validKeys = usePath.layersInvolved.map(id => String(id));
            Object.keys(usePath.avgCallsPerLayer).forEach(key => {
                if (!validKeys.includes(key)) {
                    delete usePath.avgCallsPerLayer[key];
                }
            });
        }
        
        return originalLength !== usePath.layersInvolved.length;
    }
}
