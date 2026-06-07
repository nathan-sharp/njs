import { UI } from './ui.js';
import { bake } from './engine.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const inputInfo = document.getElementById('input-info');
    const outputInfo = document.getElementById('output-info');
    const btnBake = document.getElementById('btn-bake');
    const btnClearRecipe = document.getElementById('btn-clear-recipe');

    let debounceTimer = null;

    // Initialize UI
    const ui = new UI(() => {
        // Automatically trigger bake when recipe changes
        requestBake();
    });

    // Event Listeners
    inputText.addEventListener('input', () => {
        updateLengths();
        requestBake();
    });

    btnBake.addEventListener('click', () => {
        executeBake();
    });

    btnClearRecipe.addEventListener('click', () => {
        ui.clearRecipe();
    });

    // Debounced automatic baking
    function requestBake() {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            executeBake();
        }, 300);
    }

    async function executeBake() {
        const input = inputText.value;
        const recipe = ui.getRecipeData();

        btnBake.innerHTML = 'Baking...';
        btnBake.disabled = true;

        try {
            const output = await bake(input, recipe);
            outputText.value = output;
            outputText.style.color = ''; // Reset error color
        } catch (error) {
            outputText.value = error.message;
            outputText.style.color = '#ef4444'; // Red for errors
        } finally {
            updateLengths();
            btnBake.innerHTML = 'Bake!';
            btnBake.disabled = false;
        }
    }

    function updateLengths() {
        inputInfo.textContent = `length: ${inputText.value.length}`;
        outputInfo.textContent = `length: ${outputText.value.length}`;
    }
});
