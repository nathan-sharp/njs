import { getGroupedOperations, operations } from './operations.js';

export class UI {
    constructor(onRecipeChange) {
        this.onRecipeChange = onRecipeChange;
        this.recipe = []; // Array of { id: uniqueId, opId, args: {} }
        this.nextId = 0;
        
        // DOM Elements
        this.operationsListEl = document.getElementById('operations-list');
        this.recipeListEl = document.getElementById('recipe-list');
        this.emptyStateEl = document.getElementById('recipe-empty-state');
        this.searchInput = document.getElementById('search-operations');
        
        this.initOperationsList();
        this.bindEvents();
    }

    initOperationsList() {
        this.renderOperations('');
        
        // Search functionality
        this.searchInput.addEventListener('input', (e) => {
            this.renderOperations(e.target.value.toLowerCase());
        });
    }

    renderOperations(filterText) {
        this.operationsListEl.innerHTML = '';
        const groups = getGroupedOperations();
        
        for (const [category, ops] of Object.entries(groups)) {
            const filteredOps = ops.filter(op => 
                op.name.toLowerCase().includes(filterText) || 
                op.description.toLowerCase().includes(filterText)
            );
            
            if (filteredOps.length > 0) {
                const header = document.createElement('div');
                header.className = 'category-header';
                header.textContent = category;
                this.operationsListEl.appendChild(header);
                
                filteredOps.forEach(op => {
                    const item = document.createElement('div');
                    item.className = 'operation-item';
                    item.draggable = true;
                    item.dataset.opId = op.id;
                    item.innerHTML = op.name;
                    
                    // Click to add
                    item.addEventListener('click', () => {
                        this.addOperationToRecipe(op.id);
                    });

                    // Drag to add (simplified drag)
                    item.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('newOperation', op.id);
                        e.dataTransfer.effectAllowed = 'copy';
                    });

                    this.operationsListEl.appendChild(item);
                });
            }
        }
    }

    bindEvents() {
        // Drop area events
        this.recipeListEl.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        this.recipeListEl.addEventListener('dragenter', (e) => {
            e.preventDefault();
        });

        this.recipeListEl.addEventListener('drop', (e) => {
            e.preventDefault();
            const opId = e.dataTransfer.getData('newOperation');
            if (opId && operations[opId]) {
                this.addOperationToRecipe(opId);
            }
        });
    }

    addOperationToRecipe(opId, insertIndex = null) {
        const op = operations[opId];
        const defaultArgs = {};
        op.args.forEach(a => defaultArgs[a.id] = a.default);

        const recipeItem = {
            id: 'item_' + (this.nextId++),
            opId: opId,
            args: defaultArgs,
            disabled: false
        };

        if (insertIndex !== null) {
            this.recipe.splice(insertIndex, 0, recipeItem);
        } else {
            this.recipe.push(recipeItem);
        }
        
        this.renderRecipe();
        this.onRecipeChange();
    }

    removeOperationFromRecipe(id) {
        this.recipe = this.recipe.filter(item => item.id !== id);
        this.renderRecipe();
        this.onRecipeChange();
    }
    
    clearRecipe() {
        this.recipe = [];
        this.renderRecipe();
        this.onRecipeChange();
    }

    updateOperationArg(id, argId, value) {
        const item = this.recipe.find(i => i.id === id);
        if (item) {
            item.args[argId] = value;
            this.onRecipeChange();
        }
    }

    moveRecipeItem(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        const item = this.recipe.splice(fromIndex, 1)[0];
        this.recipe.splice(toIndex, 0, item);
        this.renderRecipe();
        this.onRecipeChange();
    }

    renderRecipe() {
        // Clear all except empty state
        Array.from(this.recipeListEl.children).forEach(child => {
            if (child !== this.emptyStateEl) {
                child.remove();
            }
        });

        if (this.recipe.length === 0) {
            this.emptyStateEl.classList.remove('hidden');
            return;
        }

        this.emptyStateEl.classList.add('hidden');

        this.recipe.forEach((item, index) => {
            const op = operations[item.opId];
            const el = document.createElement('div');
            el.className = 'recipe-item';
            el.draggable = true;
            
            // Drag and drop for reordering
            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('recipeItemIndex', index);
                e.dataTransfer.effectAllowed = 'move';
            });
            
            el.addEventListener('dragover', (e) => {
                e.preventDefault();
                el.style.borderTop = '2px solid #000';
            });
            
            el.addEventListener('dragenter', (e) => {
                e.preventDefault();
            });
            
            el.addEventListener('dragleave', (e) => {
                el.style.borderTop = '';
            });
            
            el.addEventListener('drop', (e) => {
                e.preventDefault();
                el.style.borderTop = '';
                const fromIndex = e.dataTransfer.getData('recipeItemIndex');
                if (fromIndex !== '') {
                    e.stopPropagation();
                    this.moveRecipeItem(parseInt(fromIndex), index);
                } else {
                    const opId = e.dataTransfer.getData('newOperation');
                    if (opId) {
                        e.stopPropagation();
                        this.addOperationToRecipe(opId, index);
                    }
                }
            });
            
            // Header
            const header = document.createElement('div');
            header.className = 'recipe-header';
            header.innerHTML = `<span>${op.name}</span>`;
            
            const actions = document.createElement('div');
            actions.className = 'recipe-actions';
            
            const delBtn = document.createElement('button');
            delBtn.className = 'recipe-action-btn delete';
            delBtn.innerHTML = 'X';
            delBtn.onclick = () => this.removeOperationFromRecipe(item.id);
            
            actions.appendChild(delBtn);
            header.appendChild(actions);
            el.appendChild(header);

            // Args
            if (op.args.length > 0) {
                const argsContainer = document.createElement('div');
                argsContainer.className = 'recipe-args';
                
                op.args.forEach(argDef => {
                    const argRow = document.createElement('div');
                    argRow.className = 'arg-row';
                    
                    const label = document.createElement('label');
                    label.textContent = argDef.name + ' ';
                    
                    const input = document.createElement('input');
                    if (argDef.type === 'string') {
                        input.type = 'text';
                        input.value = item.args[argDef.id] || '';
                        input.addEventListener('input', (e) => {
                            this.updateOperationArg(item.id, argDef.id, e.target.value);
                        });
                    }
                    
                    argRow.appendChild(label);
                    argRow.appendChild(input);
                    argsContainer.appendChild(argRow);
                });
                
                el.appendChild(argsContainer);
            }

            this.recipeListEl.appendChild(el);
        });
    }

    getRecipeData() {
        return this.recipe;
    }
}
