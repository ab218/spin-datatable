const paramEstimates = (coeffs, xLabel, centered) => {
	let temp = ``;
	let counter = 2;
	for (let i = coeffs.length - 3; i >= 0; i--) {
		temp += `
    <tr>
      <td style="width: 34%;">${centered ? centered : xLabel}^${counter}</td>
      <td style="width: 66%;">${coeffs[i].toFixed(6) / 1}</td>
    </tr>
    `;
		counter++;
	}
	return temp;
};

const paramEstimateTable = (coeffs, xLabel, centered) => `
            <h5 style="margin-bottom: 0;">Parameter Estimates</h5>
            <table style="width: 100%;">
            <tr>
              <td style="width: 34%; font-weight: bold;">Term</td>
              <td style="width: 66%; font-weight: bold;">Estimate</td>
            </tr>
            <tr>
              <td style="width: 34%;">Intercept</td>
              <td style="width: 66%;">${coeffs[coeffs.length - 1].toFixed(6) / 1}</td>
            </tr>
            <tr>
              <td style="width: 34%;">${centered ? centered : xLabel}</td>
              <td style="width: 66%;">${coeffs[coeffs.length - 2].toFixed(6) / 1}</td>
            </tr>
            ${paramEstimates(coeffs, xLabel, centered)}
          </table>
          `;

const generateTemplate = (title, id, equation, polyDegree, coeffs, xLabel, centered) => `
        <details class="analysis-details" open id="${id}">
          <summary class="analysis-summary-title">Summary of ${title}</summary>
          <table style="width: 100%;">
            <tr>
              <td style="width: 34%;">Equation</td>
              <td style="width: 66%;">${equation}</td>
            </tr>
            <tr>
              <td style="width: 34%;">R-squared</td>
              <td style="width: 66%;">${polyDegree.determination.toFixed(6) / 1}</td>
            </tr>
            </table>
            ${paramEstimateTable(coeffs, xLabel, centered)}
          </details>
`;

const addOrSubtract = (value) => (value >= 0 ? '+' : '-');

const generateEquationTemplate = (coeffs, xLabel, yLabel, centered) => {
	let temp = `${yLabel} = ${coeffs[coeffs.length - 1].toFixed(6) / 1} ${addOrSubtract(
		coeffs[coeffs.length - 2],
	)} ${Math.abs(coeffs[1]).toFixed(6) / 1} * ${centered ? centered : xLabel}`;
	let counter = 2;
	for (let i = coeffs.length - 3; i >= 0; i--) {
		temp += ` ${addOrSubtract(coeffs[i])} ${Math.abs(coeffs[i]).toFixed(6) / 1} * ${centered
			? centered
			: xLabel}^${counter}`;
		counter++;
	}
	return temp;
};
