const paramEstimates = (coeffs, xLabel) => {
	let temp = ``;
	let counter = 2;
	for (let i = coeffs.length - 3; i >= 0; i--) {
		temp += `
    <tr>
      <td style="width: 25%;">${xLabel}^${counter}</td>
      <td style="width: 75%;">${coeffs[i].toFixed(6) / 1}</td>
    </tr>
    `;
		counter++;
	}
	return temp;
};

const paramEstimateTable = (coeffs, xLabel) => `
            <h5 style="margin-bottom: 0;">Parameter Estimates</h5>
            <table style="width: 100%;">
            <tr>
              <td style="width: 25%; font-weight: bold;">Term</td>
              <td style="width: 75%; font-weight: bold;">Estimate</td>
            </tr>
            <tr>
              <td style="width: 25%;">Intercept</td>
              <td style="width: 75%;">${coeffs[coeffs.length - 1].toFixed(6) / 1}</td>
            </tr>
            <tr>
              <td style="width: 25%;">${xLabel}</td>
              <td style="width: 75%;">${coeffs[coeffs.length - 2].toFixed(6) / 1}</td>
            </tr>
            ${paramEstimates(coeffs)}
          </table>
          `;

const generateTemplate = (title, id, equation, polyDegree, coeffs, xLabel) => `
        <details class="analysis-details" open id="${id}">
          <summary class="analysis-summary-title">Summary of ${title}</summary>
          <table style="width: 100%;">
            <tr>
              <td style="width: 25%;">Equation</td>
              <td style="width: 75%;">${equation}</td>
            </tr>
            <tr>
              <td style="width: 25%;">R-squared</td>
              <td style="width: 75%;">${polyDegree.determination.toFixed(6) / 1}</td>
            </tr>
            </table>
            ${paramEstimateTable(coeffs, xLabel)}
          </details>
`;

const addOrSubtract = (value) => (value >= 0 ? '+' : '-');

const generateEquationTemplate = (coeffs, yLabel, centeredX) => {
	let temp = `${yLabel} = ${coeffs[coeffs.length - 1].toFixed(6) / 1} ${addOrSubtract(
		coeffs[coeffs.length - 2],
	)} ${Math.abs(coeffs[1]).toFixed(6) / 1} * ${centeredX}`;
	let counter = 2;
	for (let i = coeffs.length - 3; i >= 0; i--) {
		temp += ` ${addOrSubtract(coeffs[i])} ${Math.abs(coeffs[i]).toFixed(6) / 1} * ${centeredX}^${counter}`;
		counter++;
	}
	return temp;
};
