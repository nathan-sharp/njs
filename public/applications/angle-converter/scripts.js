// Angle Converter behavior
// - Editing Decimal Degrees, any DMS field (deg/min/sec), or Radians
//   will update the other fields automatically.
// - Programmatic updates suppress event handlers to avoid feedback loops.

document.addEventListener('DOMContentLoaded', () => {
	const divs = document.querySelectorAll('main > div');
	if (divs.length < 3) return; // unexpected markup

	const degDecimalInput = divs[0].querySelector('input');
	const dmsInputs = Array.from(divs[1].querySelectorAll('input'));
	const radInput = divs[2].querySelector('input');

	let suppress = false;
	const PI = Math.PI;

	function formatNumber(value, decimals) {
		if (!isFinite(value)) return '';
		// Trim trailing zeros by converting to Number
		return Number(value.toFixed(decimals)).toString();
	}

	function degToDms(decimalDeg) {
		const sign = decimalDeg < 0 ? -1 : 1;
		let absDeg = Math.abs(decimalDeg);
		const d = Math.floor(absDeg);
		const mFloat = (absDeg - d) * 60;
		const m = Math.floor(mFloat);
		const s = (mFloat - m) * 60;
		return { deg: d * sign, min: m, sec: s };
	}

	function dmsToDeg(d, m, s) {
		const sign = (d < 0) ? -1 : 1;
		const absD = Math.abs(d);
		return sign * (absD + (Number(m) || 0) / 60 + (Number(s) || 0) / 3600);
	}

	function setFromDegrees(decimalDeg) {
		if (!isFinite(decimalDeg)) return;
		suppress = true;
		// Decimal degrees
		degDecimalInput.value = formatNumber(decimalDeg, 6);

		// DMS
		const dms = degToDms(decimalDeg);
		// Keep degree as signed integer, minutes/seconds non-negative
		dmsInputs[0].value = dms.deg.toString();
		dmsInputs[1].value = dms.min.toString();
		dmsInputs[2].value = formatNumber(dms.sec, 4);

		// Radians
		const rad = decimalDeg * PI / 180;
		radInput.value = formatNumber(rad, 8);
		suppress = false;
	}

	// Event handlers
	degDecimalInput.addEventListener('input', () => {
		if (suppress) return;
		const raw = degDecimalInput.value;
		// If user is mid-typing a negative sign or trailing decimal point, don't reformat yet
		if (raw === '' || raw === '-' || raw.slice(-1) === '.') return;
		const v = parseFloat(raw);
		if (!isFinite(v)) return;
		setFromDegrees(v);
	});

	dmsInputs.forEach((el) => {
		el.addEventListener('input', () => {
			if (suppress) return;
			const raw = el.value;
			// Allow the user to type a leading '-' or a trailing '.' without being reformatted
			if (raw === '' || raw === '-' || raw.slice(-1) === '.') return;
			const d = parseFloat(dmsInputs[0].value);
			const m = parseFloat(dmsInputs[1].value);
			const s = parseFloat(dmsInputs[2].value);
			// If all fields empty, do nothing
			if (![d, m, s].some((x) => isFinite(x))) return;
			const decimal = dmsToDeg(isFinite(d) ? d : 0, isFinite(m) ? m : 0, isFinite(s) ? s : 0);
			setFromDegrees(decimal);
		});
	});

	radInput.addEventListener('input', () => {
		if (suppress) return;
		const raw = radInput.value;
		if (raw === '' || raw === '-' || raw.slice(-1) === '.') return;
		const r = parseFloat(raw);
		if (!isFinite(r)) return;
		const deg = r * 180 / PI;
		setFromDegrees(deg);
	});

	// Optional: normalize fields on blur to nice formatting
	const allInputs = [degDecimalInput, ...dmsInputs, radInput];
	allInputs.forEach((inp) => {
		inp.addEventListener('blur', () => {
			if (suppress) return;
			// Re-run the same compute path that would have been taken on input
			if (inp === degDecimalInput) {
				const v = parseFloat(degDecimalInput.value);
				if (isFinite(v)) setFromDegrees(v);
			} else if (inp === radInput) {
				const v = parseFloat(radInput.value);
				if (isFinite(v)) setFromDegrees(v * 180 / PI);
			} else {
				const d = parseFloat(dmsInputs[0].value);
				const m = parseFloat(dmsInputs[1].value);
				const s = parseFloat(dmsInputs[2].value);
				if ([d, m, s].some((x) => isFinite(x))) {
					const decimal = dmsToDeg(isFinite(d) ? d : 0, isFinite(m) ? m : 0, isFinite(s) ? s : 0);
					setFromDegrees(decimal);
				}
			}
		});
	});

	// Fill LaTeX formulas with current values and render via MathJax
	const fillBtn = document.getElementById('fill-formula-btn');
	const filledEl = document.getElementById('filled-formulas');

	function safeNum(v) {
		return (isFinite(v) ? v : null);
	}

	function formatNumberForLatex(value, decimals) {
		if (!isFinite(value)) return '---';
		return Number(value.toFixed(decimals)).toString();
	}

	function renderFilledFormulas() {
		const ddRaw = degDecimalInput.value.trim();
		const Draw = dmsInputs[0].value.trim();
		const Mraw = dmsInputs[1].value.trim();
		const Sraw = dmsInputs[2].value.trim();
		const radRaw = radInput.value.trim();

		const dd = parseFloat(ddRaw);
		const D = parseFloat(Draw);
		const M = parseFloat(Mraw);
		const S = parseFloat(Sraw);
		const r = parseFloat(radRaw);

		// DMS -> Decimal degrees
		let dmsLatex = '';
		if ([D, M, S].some(isFinite)) {
			const absD = Math.abs(isFinite(D) ? D : 0);
			const mVal = isFinite(M) ? M : 0;
			const sVal = isFinite(S) ? S : 0;
			const ddFromDms = dmsToDeg(isFinite(D) ? D : 0, mVal, sVal);
			dmsLatex = `$$\\mathrm{DD} = \\operatorname{sign}(${D})\\cdot\\bigl(|${D}| + \\frac{${mVal}}{60} + \\frac{${sVal}}{3600}\\bigr) = ${formatNumberForLatex(ddFromDms, 6)}$$`;
		} else {
			dmsLatex = `$$\\mathrm{DD} = \\operatorname{sign}(D)\\cdot\\bigl(|D| + M/60 + S/3600\\bigr)$$`;
		}

		// Decimal -> DMS
		let decLatex = '';
		if (isFinite(dd)) {
			const signDD = dd < 0 ? -1 : 1;
			const absDD = Math.abs(dd);
			const bigD = Math.floor(absDD) * signDD;
			const rem = (absDD - Math.floor(absDD)) * 60;
			const bigM = Math.floor(rem);
			const bigS = (rem - bigM) * 60;
			decLatex = `$$D = \\operatorname{sign}(${formatNumberForLatex(dd,6)})\\cdot\\lfloor |${formatNumberForLatex(dd,6)}| \\rfloor = ${bigD},$$` +
				`$$M = \\Bigl\\lfloor (|${formatNumberForLatex(dd,6)}| - \\lfloor |${formatNumberForLatex(dd,6)}| \\rfloor)\\cdot 60 \\Bigr\\rfloor = ${bigM},$$` +
				`$$S = \\Bigl((|${formatNumberForLatex(dd,6)}| - \\lfloor |${formatNumberForLatex(dd,6)}| \\rfloor)\\cdot 60 - ${bigM}\\Bigr)\\cdot 60 = ${formatNumberForLatex(bigS,4)}$$`;
		} else {
			decLatex = `$$D = \\operatorname{sign}(\\mathrm{DD})\\cdot\\lfloor |\\mathrm{DD}| \\rfloor,$$` +
				`$$M = \\Bigl\\lfloor (|\\mathrm{DD}| - \\lfloor |\\mathrm{DD}| \\rfloor)\\cdot 60 \\Bigr\\rfloor,$$` +
				`$$S = \\Bigl((|\\mathrm{DD}| - \\lfloor |\\mathrm{DD}| \\rfloor)\\cdot 60 - M\\Bigr)\\cdot 60$$`;
		}

		// Degrees <-> Radians
		let degRadLatex = '';
		if (isFinite(dd)) {
			const radFromDeg = dd * PI / 180;
			degRadLatex = `$$\\mathrm{rad} = ${formatNumberForLatex(dd,6)}\\cdot\\frac{\\pi}{180} = ${formatNumberForLatex(radFromDeg,8)}$$` +
				`$$\\mathrm{deg} = ${formatNumberForLatex(radFromDeg,8)}\\cdot\\frac{180}{\\pi} = ${formatNumberForLatex(dd,6)}$$`;
		} else if (isFinite(r)) {
			const degFromRad = r * 180 / PI;
			degRadLatex = `$$\\mathrm{rad} = ${formatNumberForLatex(degFromRad,6)}\\cdot\\frac{\\pi}{180} = ${formatNumberForLatex(r,8)}$$` +
				`$$\\mathrm{deg} = ${formatNumberForLatex(r,8)}\\cdot\\frac{180}{\\pi} = ${formatNumberForLatex(degFromRad,6)}$$`;
		} else {
			degRadLatex = `$$\\mathrm{rad} = \\mathrm{deg}\\cdot\\frac{\\pi}{180}, \\qquad \\mathrm{deg} = \\mathrm{rad}\\cdot\\frac{180}{\\pi}$$`;
		}

		filledEl.innerHTML = dmsLatex + '<br/>' + decLatex + '<br/>' + degRadLatex;

		// Ask MathJax to typeset the inserted math
		if (window.MathJax && MathJax.typesetPromise) {
			MathJax.typesetPromise([filledEl]).catch((err) => console.error('MathJax typeset failed', err));
		}
	}

	if (fillBtn) {
		fillBtn.addEventListener('click', renderFilledFormulas);
	}
});

