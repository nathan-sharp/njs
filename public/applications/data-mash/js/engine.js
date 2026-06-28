import { operations } from './operations.js';

/**
 * Executes a single operation.
 */
async function executeOperation(opId, args, input) {
    const op = operations[opId];
    if (!op) throw new Error(`Unknown operation: ${opId}`);
    return await op.execute(input, args);
}

/**
 * Runs the entire recipe pipeline.
 * @param {string} input - The initial input string.
 * @param {Array} recipe - Array of recipe items { opId, args }
 * @returns {Promise<string>} The final output string.
 */
export async function bake(input, recipe) {
    let currentData = input;

    // If no recipe, return input
    if (!recipe || recipe.length === 0) {
        return currentData;
    }

    for (let i = 0; i < recipe.length; i++) {
        const item = recipe[i];
        
        if (item.disabled) continue;

        try {
            currentData = await executeOperation(item.opId, item.args, currentData);
        } catch (error) {
            // Include which operation failed
            throw new Error(`[${operations[item.opId]?.name || item.opId} failed]\n${error.message}`);
        }
    }

    return currentData;
}
