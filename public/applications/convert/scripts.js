// --- Unit Definitions ---
// 'r' is the ratio to the base unit (Unit = Base * r)
const definitions = {
    Length: {
        baseUnit: 'Meter',
        units: {
            'Meter': { 
                symbol: 'm', r: 1,
                desc: "The length of the path travelled by light in vacuum during a time interval of 1/299,792,458 of a second.",
                source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/base-units" }
            },
            'Kilometer': { symbol: 'km', r: 1000, desc: "A metric unit of length equal to 1,000 meters.", source: { name: "NIST", url: "https://www.nist.gov/pml/weights-and-measures/metric-si/si-units" } },
            'Centimeter': { symbol: 'cm', r: 0.01, desc: "A metric unit of length equal to 1/100 of a meter.", source: { name: "NIST", url: "https://www.nist.gov/pml/weights-and-measures/metric-si/si-units" } },
            'Millimeter': { symbol: 'mm', r: 0.001, desc: "A metric unit of length equal to 1/1000 of a meter.", source: { name: "NIST", url: "https://www.nist.gov/pml/weights-and-measures/metric-si/si-units" } },
            'Micrometer': { symbol: 'µm', r: 1e-6, desc: "A metric unit of length equal to 1×10⁻⁶ meters.", source: { name: "NIST", url: "https://www.nist.gov/pml/weights-and-measures/metric-si/si-units" } },
            'Nanometer': { symbol: 'nm', r: 1e-9, desc: "A metric unit of length equal to 1×10⁻⁹ meters.", source: { name: "NIST", url: "https://www.nist.gov/pml/weights-and-measures/metric-si/si-units" } },
            'Mile': { 
                symbol: 'mi', r: 1609.344, 
                desc: "International mile defined as exactly 1,609.344 meters.", 
                source: { name: "NIST Handbook 44", url: "https://www.nist.gov/pml/weights-and-measures/publications/nist-handbook-44" }
            },
            'Yard': { symbol: 'yd', r: 0.9144, desc: "Defined as exactly 0.9144 meters.", source: { name: "NIST SP 811", url: "https://physics.nist.gov/cuu/Units/outside.html" } },
            'Foot': { symbol: 'ft', r: 0.3048, desc: "Defined as exactly 0.3048 meters.", source: { name: "NIST SP 811", url: "https://physics.nist.gov/cuu/Units/outside.html" } },
            'Inch': { 
                symbol: 'in', r: 0.0254, 
                desc: "Defined as exactly 25.4 millimeters.", 
                source: { name: "NIST SP 811", url: "https://physics.nist.gov/cuu/Units/outside.html" } 
            },
            'Nautical Mile': { symbol: 'nmi', r: 1852, desc: "Defined as exactly 1852 meters.", source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/outside-si" } }
        }
    },
    Area: {
        baseUnit: 'Square Meter',
        units: {
            'Square Meter': { symbol: 'm²', r: 1, desc: "The coherent SI unit of area.", source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/derived-units" } },
            'Square Kilometer': { symbol: 'km²', r: 1e6, desc: "Derived from the square of a kilometer.", source: { name: "NIST", url: "https://www.nist.gov/" } },
            'Square Centimeter': { symbol: 'cm²', r: 0.0001, desc: "Derived from the square of a centimeter.", source: { name: "NIST", url: "https://www.nist.gov/" } },
            'Square Millimeter': { symbol: 'mm²', r: 1e-6, desc: "Derived from the square of a millimeter.", source: { name: "NIST", url: "https://www.nist.gov/" } },
            'Hectare': { symbol: 'ha', r: 10000, desc: "A non-SI unit accepted for use with the SI, equal to 10,000 square meters.", source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/outside-si" } },
            'Acre': { symbol: 'ac', r: 4046.8564224, desc: "International acre, defined based on the international yard.", source: { name: "NIST Handbook 44", url: "https://www.nist.gov/pml/weights-and-measures/publications/nist-handbook-44" } },
            'Square Mile': { symbol: 'mi²', r: 2589988.110336, desc: "Derived from the square of the international mile.", source: { name: "NIST", url: "https://www.nist.gov/" } },
            'Square Yard': { symbol: 'yd²', r: 0.83612736, desc: "Derived from the square of the international yard.", source: { name: "NIST", url: "https://www.nist.gov/" } },
            'Square Foot': { symbol: 'ft²', r: 0.09290304, desc: "Derived from the square of the international foot.", source: { name: "NIST", url: "https://www.nist.gov/" } },
            'Square Inch': { symbol: 'in²', r: 0.00064516, desc: "Derived from the square of the international inch.", source: { name: "NIST", url: "https://www.nist.gov/" } }
        }
    },
    Volume: {
        baseUnit: 'Liter',
        units: {
            'Liter': { symbol: 'L', r: 1, desc: "Defined as 1 cubic decimeter (0.001 cubic meters).", source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/outside-si" } },
            'Milliliter': { symbol: 'mL', r: 0.001, desc: "1/1000 of a liter, equal to 1 cubic centimeter.", source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/outside-si" } },
            'Cubic Meter': { symbol: 'm³', r: 1000, desc: "The coherent SI unit of volume.", source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/derived-units" } },
            'Cubic Centimeter': { symbol: 'cm³', r: 0.001, desc: "Common metric unit of volume.", source: { name: "NIST", url: "https://www.nist.gov/" } },
            'Gallon (US)': { 
                symbol: 'gal', r: 3.785411784, 
                desc: "Defined as 231 cubic inches.", 
                source: { name: "NIST Handbook 44", url: "https://www.nist.gov/pml/weights-and-measures/publications/nist-handbook-44" } 
            },
            'Quart (US)': { symbol: 'qt', r: 0.946352946, desc: "Defined as 1/4 of a US Gallon.", source: { name: "NIST Handbook 44", url: "https://www.nist.gov/" } },
            'Pint (US)': { symbol: 'pt', r: 0.473176473, desc: "Defined as 1/8 of a US Gallon.", source: { name: "NIST Handbook 44", url: "https://www.nist.gov/" } },
            'Cup (US)': { symbol: 'cup', r: 0.2365882365, desc: "Customary unit equal to 8 fluid ounces.", source: { name: "NIST", url: "https://www.nist.gov/" } },
            'Fluid Ounce (US)': { symbol: 'fl oz', r: 0.0295735295625, desc: "Defined as 1/128 of a US Gallon.", source: { name: "NIST Handbook 44", url: "https://www.nist.gov/" } },
            'Gallon (UK)': { symbol: 'gal (UK)', r: 4.54609, desc: "Imperial gallon, defined as 4.54609 liters.", source: { name: "UK Legislation", url: "https://www.legislation.gov.uk/uksi/1995/1804/schedule/made" } },
            'Fluid Ounce (UK)': { symbol: 'fl oz (UK)', r: 0.0284130625, desc: "1/160 of an Imperial Gallon.", source: { name: "UK Legislation", url: "https://www.legislation.gov.uk/" } }
        }
    },
    Mass: {
        baseUnit: 'Kilogram',
        units: {
            'Kilogram': { 
                symbol: 'kg', r: 1, 
                desc: "Defined by taking the fixed numerical value of the Planck constant h to be 6.62607015×10⁻³⁴ when expressed in the unit J⋅s.", 
                source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/base-units" } 
            },
            'Gram': { symbol: 'g', r: 0.001, desc: "1/1000 of a kilogram.", source: { name: "BIPM", url: "https://www.bipm.org/" } },
            'Milligram': { symbol: 'mg', r: 1e-6, desc: "1/1,000,000 of a kilogram.", source: { name: "BIPM", url: "https://www.bipm.org/" } },
            'Microgram': { symbol: 'µg', r: 1e-9, desc: "10⁻⁹ kilograms.", source: { name: "BIPM", url: "https://www.bipm.org/" } },
            'Metric Ton': { symbol: 't', r: 1000, desc: "Non-SI unit accepted for use with SI, equal to 1000 kg.", source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/outside-si" } },
            'Pound': { 
                symbol: 'lb', r: 0.45359237, 
                desc: "The international avoirdupois pound is defined as exactly 0.45359237 kilograms.", 
                source: { name: "NIST SP 811", url: "https://physics.nist.gov/cuu/Units/outside.html" } 
            },
            'Ounce': { symbol: 'oz', r: 0.028349523125, desc: "1/16 of an international pound.", source: { name: "NIST", url: "https://www.nist.gov/" } },
            'Stone': { symbol: 'st', r: 6.35029318, desc: "Defined as 14 pounds.", source: { name: "UK Legislation", url: "https://www.legislation.gov.uk/" } },
            'Short Ton (US)': { symbol: 'ton (US)', r: 907.18474, desc: "Defined as 2000 pounds.", source: { name: "NIST", url: "https://www.nist.gov/" } }
        }
    },
    Energy: {
        baseUnit: 'Joule',
        units: {
            'Joule': { symbol: 'J', r: 1, desc: "SI derived unit of energy. Equal to the work done by a force of one newton when its point of application moves one meter in the direction of action of the force.", source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/derived-units" } },
            'Kilojoule': { symbol: 'kJ', r: 1000, desc: "1000 Joules.", source: { name: "BIPM", url: "https://www.bipm.org/" } },
            'Megajoule': { symbol: 'MJ', r: 1e6, desc: "1,000,000 Joules.", source: { name: "BIPM", url: "https://www.bipm.org/" } },
            'Gigajoule': { symbol: 'GJ', r: 1e9, desc: "10⁹ Joules.", source: { name: "BIPM", url: "https://www.bipm.org/" } },
            'Millijoule': { symbol: 'mJ', r: 0.001, desc: "10⁻³ Joules.", source: { name: "BIPM", url: "https://www.bipm.org/" } },
            'Microjoule': { symbol: 'µJ', r: 1e-6, desc: "10⁻⁶ Joules.", source: { name: "BIPM", url: "https://www.bipm.org/" } },
            'Nanojoule': { symbol: 'nJ', r: 1e-9, desc: "10⁻⁹ Joules.", source: { name: "BIPM", url: "https://www.bipm.org/" } },
            'Watt-hour': { symbol: 'Wh', r: 3600, desc: "Energy equivalent to one watt of power expended for one hour. Exactly 3600 Joules.", source: { name: "NIST", url: "https://www.nist.gov/" } },
            'Kilowatt-hour': { symbol: 'kWh', r: 3.6e6, desc: "1000 Watt-hours. Exactly 3.6 MJ.", source: { name: "NIST", url: "https://www.nist.gov/" } },
            'Calorie (IT)': { symbol: 'cal', r: 4.1868, desc: "International Table calorie, defined as exactly 4.1868 Joules.", source: { name: "ISO 80000-5", url: "https://www.iso.org/standard/31890.html" } },
            'Kilocalorie (IT)': { symbol: 'kcal', r: 4186.8, desc: "1000 IT calories (often used in nutrition).", source: { name: "NIST", url: "https://www.nist.gov/" } },
            'Btu (IT)': { symbol: 'Btu', r: 1055.05585262, desc: "British Thermal Unit (International Table). Defined via the IT calorie and pound.", source: { name: "NIST SP 811", url: "https://physics.nist.gov/cuu/Units/outside.html" } },
            'Btu (th)': { symbol: 'Btu (th)', r: 1054.350, desc: "Thermochemical British Thermal Unit. Approximate value dependent on water temperature context.", source: { name: "NIST SP 811", url: "https://physics.nist.gov/cuu/Units/outside.html" } },
            'Electron-volt': { symbol: 'eV', r: 1.602176634e-19, desc: "The amount of kinetic energy gained by a single electron accelerating from rest through an electric potential difference of one volt.", source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/outside-si" } }
        }
    },
    Temperature: {
        type: 'function',
        baseUnit: 'Celsius',
        units: {
            'Celsius': { 
                symbol: '°C',
                toBase: v => v,
                fromBase: v => v,
                format: v => `T_{^\\circ C}`,
                desc: "The degree Celsius is the SI unit of temperature. Defined by taking the fixed numerical value of the Boltzmann constant k to be 1.380 649 × 10⁻²³ when expressed in the unit J K⁻¹, where the triple point of water is 273.16 K.",
                source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/base-units" }
            },
            'Fahrenheit': { 
                symbol: '°F',
                toBase: v => (v - 32) * 5/9,
                fromBase: v => (v * 9/5) + 32,
                format: v => `T_{^\\circ F}`,
                desc: "A scale based on 32 degrees for the freezing point of water and 212 degrees for the boiling point of water.",
                source: { name: "NIST", url: "https://www.nist.gov/" }
            },
            'Kelvin': { 
                symbol: 'K',
                toBase: v => v - 273.15,
                fromBase: v => v + 273.15,
                format: v => `T_K`,
                desc: "The SI base unit of thermodynamic temperature.",
                source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/base-units" }
            },
            'Rankine': {
                symbol: '°R',
                toBase: v => (v - 491.67) * 5/9,
                fromBase: v => (v + 273.15) * 9/5,
                format: v => `T_{^\\circ R}`,
                desc: "An absolute scale of thermodynamic temperature named after William John Macquorn Rankine.",
                source: { name: "NIST", url: "https://www.nist.gov/" }
            }
        }
    },
    Time: {
        baseUnit: 'Second',
        units: {
            'Second': { 
                symbol: 's', r: 1, 
                desc: "The SI base unit of time. Defined by taking the fixed numerical value of the caesium frequency ∆νCs, the unperturbed ground-state hyperfine transition frequency of the caesium 133 atom, to be 9 192 631 770 when expressed in the unit Hz, which is equal to s⁻¹.", 
                source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/base-units" } 
            },
            'Millisecond': { symbol: 'ms', r: 0.001, desc: "1/1000 of a second.", source: { name: "BIPM", url: "https://www.bipm.org/" } },
            'Microsecond': { symbol: 'µs', r: 1e-6, desc: "10⁻⁶ seconds.", source: { name: "BIPM", url: "https://www.bipm.org/" } },
            'Nanosecond': { symbol: 'ns', r: 1e-9, desc: "10⁻⁹ seconds.", source: { name: "BIPM", url: "https://www.bipm.org/" } },
            'Minute': { symbol: 'min', r: 60, desc: "Non-SI unit accepted for use with SI, equal to 60 seconds.", source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/outside-si" } },
            'Hour': { symbol: 'h', r: 3600, desc: "Non-SI unit accepted for use with SI, equal to 60 minutes or 3600 seconds.", source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/outside-si" } },
            'Day': { symbol: 'd', r: 86400, desc: "Non-SI unit accepted for use with SI, equal to 24 hours or 86,400 seconds.", source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/outside-si" } },
            'Week': { symbol: 'wk', r: 604800, desc: "Equal to 7 days.", source: { name: "NIST SP 811", url: "https://physics.nist.gov/cuu/Units/outside.html" } },
            'Year': { symbol: 'yr', r: 31536000, desc: "Common year, defined as 365 days.", source: { name: "NIST SP 811", url: "https://physics.nist.gov/cuu/Units/outside.html" } },
            'Decade': { symbol: 'decade', r: 315360000, desc: "A period of 10 years.", source: { name: "NIST", url: "https://www.nist.gov/" } },
            'Century': { symbol: 'century', r: 3153600000, desc: "A period of 100 years.", source: { name: "NIST", url: "https://www.nist.gov/" } }
        }
    },
    Speed: {
        baseUnit: 'Meter per second',
        units: {
            'Meter per second': { symbol: 'm/s', r: 1, desc: "The coherent SI unit of speed.", source: { name: "BIPM", url: "https://www.bipm.org/" } },
            'Kilometer per hour': { symbol: 'km/h', r: 0.277777778, desc: "Metric unit of speed equal to 1000 meters in 3600 seconds.", source: { name: "NIST", url: "https://www.nist.gov/" } },
            'Mile per hour': { symbol: 'mph', r: 0.44704, desc: "Speed of 1 international mile per hour.", source: { name: "NIST SP 811", url: "https://physics.nist.gov/cuu/Units/outside.html" } },
            'Knot': { symbol: 'kn', r: 0.514444444, desc: "1 Nautical mile per hour. Exactly 1.852 km/h.", source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/outside-si" } },
            'Foot per second': { symbol: 'ft/s', r: 0.3048, desc: "Speed of 1 international foot per second.", source: { name: "NIST", url: "https://www.nist.gov/" } }
        }
    },
    Pressure: {
        baseUnit: 'Pascal',
        units: {
            'Pascal': { symbol: 'Pa', r: 1, desc: "SI derived unit of pressure. One newton per square meter.", source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/derived-units" } },
            'Kilopascal': { symbol: 'kPa', r: 1000, desc: "1000 Pascals.", source: { name: "BIPM", url: "https://www.bipm.org/" } },
            'Megapascal': { symbol: 'MPa', r: 1e6, desc: "1,000,000 Pascals.", source: { name: "BIPM", url: "https://www.bipm.org/" } },
            'Bar': { symbol: 'bar', r: 100000, desc: "Exactly 100,000 Pascals.", source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/outside-si" } },
            'PSI': { symbol: 'psi', r: 6894.757293168, desc: "Pounds per square inch.", source: { name: "NIST SP 811", url: "https://physics.nist.gov/cuu/Units/outside.html" } },
            'Atmosphere': { symbol: 'atm', r: 101325, desc: "Standard atmosphere, defined exactly as 101,325 Pa.", source: { name: "NIST SP 811", url: "https://physics.nist.gov/cuu/Units/outside.html" } },
            'Torr': { symbol: 'Torr', r: 133.322368, desc: "1/760 of a standard atmosphere.", source: { name: "NIST", url: "https://www.nist.gov/" } }
        }
    },
    'Flow Rate': {
        baseUnit: 'Cubic meter per second',
        units: {
            'Cubic meter per second': { symbol: 'm³/s', r: 1, desc: "SI derived unit of volumetric flow rate.", source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/derived-units" } },
            'Cubic meter per hour': { symbol: 'm³/h', r: 1/3600, desc: "Common metric unit for larger flow rates.", source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/outside-si" } },
            'Liter per second': { symbol: 'L/s', r: 0.001, desc: "Common metric unit of volumetric flow rate.", source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/outside-si" } },
            'Liter per minute': { symbol: 'L/min', r: 0.001 / 60, desc: "Common metric unit of volumetric flow rate.", source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/outside-si" } },
            'Cubic foot per second': { symbol: 'ft³/s', r: 0.028316846592, desc: "US Customary unit of volumetric flow rate.", source: { name: "NIST SP 811", url: "https://physics.nist.gov/Pubs/SP811/appenB9.html" } },
            'Cubic foot per minute': { symbol: 'CFM', r: 0.028316846592 / 60, desc: "US Customary unit of volumetric flow rate.", source: { name: "NIST SP 811", url: "https://physics.nist.gov/Pubs/SP811/appenB9.html" } },
            'Gallon per minute (US)': { symbol: 'GPM', r: 3.785411784 * 0.001 / 60, desc: "US Customary unit of volumetric flow rate.", source: { name: "NIST SP 811", url: "https://physics.nist.gov/Pubs/SP811/appenB9.html" } },
            'Gallon per hour (US)': { symbol: 'GPH', r: 3.785411784 * 0.001 / 3600, desc: "US Customary unit of volumetric flow rate.", source: { name: "NIST SP 811", url: "https://physics.nist.gov/Pubs/SP811/appenB9.html" } },
            'Barrel per day (Petroleum)': { symbol: 'bbl/d', r: 0.158987294928 / 86400, desc: "Standard oil field unit of volumetric flow rate (42 US gallons per day).", source: { name: "NIST SP 811", url: "https://physics.nist.gov/Pubs/SP811/appenB9.html" } },
            'Barrel per hour (Petroleum)': { symbol: 'bbl/h', r: 0.158987294928 / 3600, desc: "Standard oil field unit of volumetric flow rate (42 US gallons per hour).", source: { name: "NIST SP 811", url: "https://physics.nist.gov/Pubs/SP811/appenB9.html" } }
        }
    },
    Torque: {
        baseUnit: 'Newton-meter',
        units: {
            'Newton-meter': { symbol: 'N·m', r: 1, desc: "SI derived unit of torque (moment of force).", source: { name: "BIPM", url: "https://www.bipm.org/en/measurement-units/derived-units" } },
            'Pound-foot': { symbol: 'lb·ft', r: 1.3558179483314004, desc: "US Customary unit of torque (often called foot-pound).", source: { name: "NIST SP 811", url: "https://physics.nist.gov/cuu/Units/outside.html" } },
            'Pound-inch': { symbol: 'lb·in', r: 0.1129848290276167, desc: "US Customary unit of torque (often called inch-pound).", source: { name: "NIST SP 811", url: "https://physics.nist.gov/cuu/Units/outside.html" } },
            'Kilogram-meter': { symbol: 'kgf·m', r: 9.80665, desc: "Metric unit of torque based on kilogram-force.", source: { name: "NIST SP 811", url: "https://physics.nist.gov/cuu/Units/outside.html" } }
        }
    }
};

// --- State ---
let currentCategory = 'Energy';
let lastEdited = 'from'; // 'from' or 'to'

// --- Elements ---
const els = {
    cat: document.getElementById('categorySelect'),
    fVal: document.getElementById('fromVal'),
    fUnit: document.getElementById('fromUnit'),
    tVal: document.getElementById('toVal'),
    tUnit: document.getElementById('toUnit'),
    res: document.getElementById('resultText'),
    mathFormula: document.getElementById('formulaMath'),
    mathFilled: document.getElementById('filledMath'),
    sourceList: document.getElementById('sourceList')
};

// --- Initialization ---
function init() {
    // Populate Categories
    const categories = Object.keys(definitions).sort(); // Sort Alphabetically

    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.innerText = cat;
        els.cat.appendChild(opt);
    });

    els.cat.value = currentCategory;
    populateUnits();
    update();

    // Listeners
    els.cat.addEventListener('change', () => {
        currentCategory = els.cat.value;
        populateUnits();
        update();
    });

    els.fVal.addEventListener('input', () => { lastEdited = 'from'; update(); });
    els.tVal.addEventListener('input', () => { lastEdited = 'to'; update(); });
    els.fUnit.addEventListener('change', () => { lastEdited = 'from'; update(); });
    els.tUnit.addEventListener('change', () => { lastEdited = 'from'; update(); }); // Prefer forward calc on unit change
}

function populateUnits() {
    const unitsObj = definitions[currentCategory].units;
    
    // Convert to array and sort
    const unitEntries = Object.entries(unitsObj).sort((a, b) => {
        const valA = a[1];
        const valB = b[1];
        
        // Sort by 'r' (magnitude) if available
        if (typeof valA.r === 'number' && typeof valB.r === 'number') {
            return valA.r - valB.r;
        }
        // Fallback to alphabetical (e.g. for Temperature)
        return a[0].localeCompare(b[0]);
    });
    
    const unitNames = unitEntries.map(e => e[0]);
    
    // Save current selection if possible
    const oldF = els.fUnit.value;
    const oldT = els.tUnit.value;

    els.fUnit.innerHTML = '';
    els.tUnit.innerHTML = '';

    unitEntries.forEach(entry => {
        const u = entry[0];
        const data = entry[1];

        const optF = document.createElement('option');
        optF.value = u;
        optF.innerText = `${u} [${data.symbol}]`;
        els.fUnit.appendChild(optF);

        const optT = document.createElement('option');
        optT.value = u;
        optT.innerText = `${u} [${data.symbol}]`;
        els.tUnit.appendChild(optT);
    });

    // Set defaults (First two or preserve)
    if (unitsObj[oldF]) els.fUnit.value = oldF;
    else els.fUnit.value = unitNames[0];

    if (unitsObj[oldT]) els.tUnit.value = oldT;
    else els.tUnit.value = (unitNames.length > 1 ? unitNames[1] : unitNames[0]);
}

// --- Math & Format ---
function formatNumber(num) {
    if (Math.abs(num) < 1e-6 || Math.abs(num) > 1e7) {
        return num.toExponential(4).replace('e+', ' \\cdot 10^{').replace('e-', ' \\cdot 10^{-') + '}';
    }
    return parseFloat(num.toPrecision(6)); // Clean up floating point dust
}

function update() {
    const catDef = definitions[currentCategory];
    const fName = els.fUnit.value;
    const tName = els.tUnit.value;
    
    if (!fName || !tName) return;

    const fObj = catDef.units[fName];
    const tObj = catDef.units[tName];

    let valIn, valOut, fSym, tSym;
    let formulaStr = '';
    let filledStr = '';

    // Determine direction
    if (lastEdited === 'from') {
        valIn = parseFloat(els.fVal.value);
        if (isNaN(valIn)) return;
        
        if (catDef.type === 'function') {
            // Functional (Temp)
            const base = fObj.toBase(valIn);
            valOut = tObj.fromBase(base);
            formulaStr = `$$ ${tObj.symbol} = \\text{convert}(${fObj.symbol}) $$`;
            filledStr = `$$ ${formatNumber(valOut)} = \\dots $$`;
        } else {
            // Linear (Factor based)
            const ratio = fObj.r / tObj.r;
            valOut = valIn * ratio;

            fSym = fObj.symbol;
            tSym = tObj.symbol;
            
            formulaStr = `$$ \\text{Value}_{${tSym}} = \\text{Value}_{${fSym}} \\times ${formatNumber(ratio)} $$`;
            filledStr = `$$ ${formatNumber(valOut)} = ${formatNumber(valIn)} \\times ${formatNumber(ratio)} $$`;
        }
        
        els.tVal.value = parseFloat(valOut.toPrecision(10)); // Update DOM
    
    } else {
        // Reverse calculation (Editing 'To')
        valIn = parseFloat(els.tVal.value); 
        if (isNaN(valIn)) return;

        if (catDef.type === 'function') {
            const base = tObj.toBase(valIn);
            valOut = fObj.fromBase(base);
        } else {
            // Linear
            const ratio = tObj.r / fObj.r;
            valOut = valIn * ratio;
            
            fSym = tObj.symbol; 
            tSym = fObj.symbol; 

            formulaStr = `$$ \\text{Value}_{${tSym}} = \\text{Value}_{${fSym}} \\times ${formatNumber(ratio)} $$`;
            filledStr = `$$ ${formatNumber(valOut)} = ${formatNumber(valIn)} \\times ${formatNumber(ratio)} $$`;
        }

        els.fVal.value = parseFloat(valOut.toPrecision(10));
    }

    // Handle Temperature Formulas Explicitly for nice display
    if (catDef.type === 'function') {
            handleTempDisplay(fName, tName, parseFloat(els.fVal.value), parseFloat(els.tVal.value));
    } else {
        renderMath(formulaStr, filledStr);
    }

    // Text Result
    els.res.innerHTML = `${els.fVal.value} ${fName} = ${els.tVal.value} ${tName}`;

    // Update Sources
    updateSources(fName, fObj, tName, tObj);
}

function updateSources(fName, fObj, tName, tObj) {
    // Clear list
    els.sourceList.innerHTML = '';

    // Helper to add item
    const addItem = (name, obj) => {
        const dt = document.createElement('dt');
        dt.style.fontWeight = "bold";
        dt.style.marginTop = "10px";
        dt.innerText = name;
        
        const dd = document.createElement('dd');
        dd.style.marginLeft = "20px";
        
        let html = obj.desc || "No definition available.";
        if (obj.source) {
            html += ` <br><span style="font-size:0.9em; color:#555;">Authority: <a href="${obj.source.url}" target="_blank" rel="noopener noreferrer">${obj.source.name}</a></span>`;
        }
        dd.innerHTML = html;
        
        els.sourceList.appendChild(dt);
        els.sourceList.appendChild(dd);
    };

    addItem(fName, fObj);
    if (fName !== tName) {
        addItem(tName, tObj);
    }
}

function handleTempDisplay(from, to, valF, valT) {
    let fTex = "";
    let vTex = "";
    
    // Define standard formulas for display
    // T_c, T_f, T_k
    const vF = formatNumber(valF);
    const vT = formatNumber(valT);

    if (from === 'Celsius' && to === 'Fahrenheit') {
        fTex = `$$ T_{^\\circ F} = (T_{^\\circ C} \\times \\frac{9}{5}) + 32 $$`;
        vTex = `$$ ${vT} = (${vF} \\times 1.8) + 32 $$`;
    } else if (from === 'Fahrenheit' && to === 'Celsius') {
        fTex = `$$ T_{^\\circ C} = (T_{^\\circ F} - 32) \\times \\frac{5}{9} $$`;
        vTex = `$$ ${vT} = (${vF} - 32) \\times 0.555\\dots $$`;
    } else if (from === 'Celsius' && to === 'Kelvin') {
        fTex = `$$ T_K = T_{^\\circ C} + 273.15 $$`;
        vTex = `$$ ${vT} = ${vF} + 273.15 $$`;
    } else if (from === 'Kelvin' && to === 'Celsius') {
        fTex = `$$ T_{^\\circ C} = T_K - 273.15 $$`;
        vTex = `$$ ${vT} = ${vF} - 273.15 $$`;
    } else {
        // Fallback for less common or indirect
            fTex = `$$ \\text{Complex conversion} $$`;
            vTex = `$$ ${vT} = \\dots $$`;
    }
    renderMath(fTex, vTex);
}

function renderMath(fStr, vStr) {
    els.mathFormula.innerHTML = fStr;
    els.mathFilled.innerHTML = vStr;
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise([els.mathFormula, els.mathFilled]);
    }
}

// Start
init();