/**
 * Registry of all available operations.
 * Each operation has a name, category, description, optional arguments, and an execute function.
 * Execute functions are async to support future operations like hashing via Web Crypto API.
 */

export const operations = {
    // Data Format
    'toBase64': {
        id: 'toBase64',
        name: 'To Base64',
        category: 'Data format',
        icon: 'fa-code',
        description: 'Encodes data into Base64 format.',
        args: [],
        execute: async (input, args) => {
            try {
                // Handle Unicode properly by converting to URI components then escaping
                return btoa(unescape(encodeURIComponent(input)));
            } catch (e) {
                throw new Error('Could not encode to Base64: ' + e.message);
            }
        }
    },
    'fromBase64': {
        id: 'fromBase64',
        name: 'From Base64',
        category: 'Data format',
        icon: 'fa-code',
        description: 'Decodes data from Base64 format.',
        args: [],
        execute: async (input, args) => {
            if (!input) return '';
            try {
                return decodeURIComponent(escape(atob(input.trim())));
            } catch (e) {
                throw new Error('Invalid Base64 input.');
            }
        }
    },
    'toHex': {
        id: 'toHex',
        name: 'To Hex',
        category: 'Data format',
        icon: 'fa-hashtag',
        description: 'Converts data into a Hexadecimal string.',
        args: [
            { id: 'delimiter', name: 'Delimiter', type: 'string', default: 'Space' }
        ],
        execute: async (input, args) => {
            const delimMap = { 'Space': ' ', 'Comma': ',', 'None': '', 'Colon': ':' };
            const delim = delimMap[args.delimiter] !== undefined ? delimMap[args.delimiter] : ' ';
            
            // Encode as UTF-8 first
            const utf8 = unescape(encodeURIComponent(input));
            let result = [];
            for (let i = 0; i < utf8.length; i++) {
                let hex = utf8.charCodeAt(i).toString(16).padStart(2, '0');
                result.push(hex);
            }
            return result.join(delim);
        }
    },
    'fromHex': {
        id: 'fromHex',
        name: 'From Hex',
        category: 'Data format',
        icon: 'fa-hashtag',
        description: 'Converts a Hexadecimal string back to raw data.',
        args: [
            { id: 'delimiter', name: 'Delimiter', type: 'string', default: 'Auto' }
        ],
        execute: async (input, args) => {
            if (!input) return '';
            // Remove delimiters
            let cleanInput = input.replace(/[^a-fA-F0-9]/g, '');
            if (cleanInput.length % 2 !== 0) {
                throw new Error('Invalid hex string length.');
            }
            
            let str = '';
            for (let i = 0; i < cleanInput.length; i += 2) {
                str += String.fromCharCode(parseInt(cleanInput.substr(i, 2), 16));
            }
            try {
                return decodeURIComponent(escape(str));
            } catch(e) {
                return str; // Fallback if not valid utf-8
            }
        }
    },
    'toBinary': {
        id: 'toBinary',
        name: 'To Binary',
        category: 'Data format',
        description: 'Converts data into a Binary string.',
        args: [
            { id: 'delimiter', name: 'Delimiter', type: 'string', default: 'Space' }
        ],
        execute: async (input, args) => {
            const delimMap = { 'Space': ' ', 'Comma': ',', 'None': '', 'Colon': ':' };
            const delim = delimMap[args.delimiter] !== undefined ? delimMap[args.delimiter] : ' ';
            
            const utf8 = unescape(encodeURIComponent(input));
            let result = [];
            for (let i = 0; i < utf8.length; i++) {
                let bin = utf8.charCodeAt(i).toString(2).padStart(8, '0');
                result.push(bin);
            }
            return result.join(delim);
        }
    },
    'fromBinary': {
        id: 'fromBinary',
        name: 'From Binary',
        category: 'Data format',
        description: 'Converts a Binary string back to raw data.',
        args: [
            { id: 'delimiter', name: 'Delimiter', type: 'string', default: 'Auto' }
        ],
        execute: async (input, args) => {
            if (!input) return '';
            let cleanInput = input.replace(/[^01]/g, '');
            if (cleanInput.length % 8 !== 0) {
                throw new Error('Invalid binary string length (must be a multiple of 8).');
            }
            
            let str = '';
            for (let i = 0; i < cleanInput.length; i += 8) {
                str += String.fromCharCode(parseInt(cleanInput.substr(i, 8), 2));
            }
            try {
                return decodeURIComponent(escape(str));
            } catch(e) {
                return str;
            }
        }
    },
    
    // Encoding
    'urlEncode': {
        id: 'urlEncode',
        name: 'URL Encode',
        category: 'Encoding',
        icon: 'fa-link',
        description: 'Encodes characters to be safely used in a URL.',
        args: [],
        execute: async (input, args) => {
            return encodeURIComponent(input);
        }
    },
    'urlDecode': {
        id: 'urlDecode',
        name: 'URL Decode',
        category: 'Encoding',
        icon: 'fa-link',
        description: 'Decodes a URL-encoded string.',
        args: [],
        execute: async (input, args) => {
            try {
                return decodeURIComponent(input);
            } catch (e) {
                throw new Error('Invalid URL encoding.');
            }
        }
    },

    // String manipulation
    'reverse': {
        id: 'reverse',
        name: 'Reverse',
        category: 'String',
        icon: 'fa-backward',
        description: 'Reverses the input string.',
        args: [],
        execute: async (input, args) => {
            return input.split('').reverse().join('');
        }
    },
    'toUpperCase': {
        id: 'toUpperCase',
        name: 'To Upper case',
        category: 'String',
        icon: 'fa-font',
        description: 'Converts the input to uppercase.',
        args: [],
        execute: async (input, args) => {
            return input.toUpperCase();
        }
    },
    'toLowerCase': {
        id: 'toLowerCase',
        name: 'To Lower case',
        category: 'String',
        icon: 'fa-font',
        description: 'Converts the input to lowercase.',
        args: [],
        execute: async (input, args) => {
            return input.toLowerCase();
        }
    },

    // Cryptography
    'sha256': {
        id: 'sha256',
        name: 'SHA256 Hash',
        category: 'Cryptography',
        icon: 'fa-lock',
        description: 'Calculates the SHA256 hash of the input.',
        args: [],
        execute: async (input, args) => {
            const msgUint8 = new TextEncoder().encode(input);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        }
    }
};

// Helper to group operations by category
export function getGroupedOperations() {
    const groups = {};
    for (const [id, op] of Object.entries(operations)) {
        if (!groups[op.category]) {
            groups[op.category] = [];
        }
        groups[op.category].push(op);
    }
    return groups;
}
