/*global d3 svg, reversedLine normalBarFill clickedBarFill normalPointFill normalPointSize clickedBarPointSize*/

// magic shared globals
const normalBarFill = '#69b3a2';
const clickedBarFill = 'red';
const normalPointFill = 'black';
const normalPointSize = 2;
const clickedBarPointSize = normalPointSize * 2;
const highlightedPointColor = 'red';
const highlightedPointSize = normalPointSize * 2.5;

const regressionTooltip = d3.select('body').append('div').attr('class', 'regression-line tooltip').style('opacity', 0);

//generate n (step) points given some range and equation (ie: y = ax^2+bx+c)
function createPoints(rangeX, step, equation) {
	return Array.from({ length: Math.round((rangeX[1] - rangeX[0]) / step) || 1 }, function(_, i) {
		const x = rangeX[0] + i * step;
		return [ x, equation(x) ];
	});
}

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

const generateTemplate = (title, id, className, equation, polyDegree, coeffs, xLabel, centered) => `
        <details class="analysis-details ${className}" open id="${id}">
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

function unload(e) {
	e.preventDefault();
	// Chrome requires returnValue to be set
	e.returnValue = '';
	window.opener.postMessage('closed', '*');
}

function toggleCenteredPoly(checked) {
	const centeredEls = document.getElementsByClassName('centered');
	const uncenteredEls = document.getElementsByClassName('uncentered');
	if (checked) {
		for (let i = 0; i < centeredEls.length; i++) {
			centeredEls[i].style.display = 'block';
		}
		for (let i = 0; i < uncenteredEls.length; i++) {
			uncenteredEls[i].style.display = 'none';
		}
	} else {
		for (let i = 0; i < centeredEls.length; i++) {
			centeredEls[i].style.display = 'none';
		}
		for (let i = 0; i < uncenteredEls.length; i++) {
			uncenteredEls[i].style.display = 'block';
		}
	}
}

const evaluatePValue = (pValue) => (pValue < 0.0001 ? '<0.0001' : pValue);

function onClickSelectCells(thisBar, bar, col) {
	let metaKeyPressed = false;

	if (d3.event.metaKey) {
		metaKeyPressed = true;
	} else {
		d3.selectAll('.point').style('fill', normalPointFill).attr('r', normalPointSize);
		// if (thisBar.style('fill') === clickedBarPointFill) {
		// 	d3.selectAll('.point').style('fill', 'black').attr('r', 2);
		// 	thisBar.style('fill', normalBarFill);
		// 	return;
		// }
		// If meta key is not held down, remove other highlighted bars
		d3.selectAll('rect').style('fill', normalBarFill);
	}

	// TODO: If holding meta key and click on bar again, deselect cells
	// if (metaKeyPressed && thisBar.style("fill") === clickedBarPointFill) {
	//   thisBar.style("fill", "#69b3a2");
	//   window.opener.postMessage({
	//     message: 'unclicked',
	//     metaKeyPressed,
	//     vals: bar,
	//   }, '*');
	//   return;
	// }
	thisBar.style('fill', clickedBarFill);
	d3
		.selectAll('.point')
		.filter((d) => {
			const binMin = bar.x0;
			const binMax = bar.x1;
			if (!d) {
				return null;
			}
			if (col === 'x') {
				return d[0] >= binMin && d[0] < binMax;
			}
			return d[1] >= binMin && d[1] < binMax;
		})
		.attr('r', clickedBarPointSize)
		.style('fill', clickedBarFill);
	window.opener.postMessage(
		{
			message: 'clicked',
			metaKeyPressed,
			vals: bar,
			col,
		},
		'*',
	);
}

function onClickBarSelectCellsBarChart(thisBar, bar, colXId, colYId, colZId) {
	let metaKeyPressed = false;
	if (d3.event.metaKey) {
		metaKeyPressed = true;
	}
	window.opener.postMessage(
		{
			message: 'clicked',
			metaKeyPressed,
			rowID: bar.row.rowID,
			colXId,
			colYId,
			colZId,
		},
		'*',
	);
}

function onClickSelectGroupBarChart(label, colZ) {
	let metaKeyPressed = false;
	if (d3.event.metaKey) {
		metaKeyPressed = true;
	}
	const column = colZ;
	column['text'] = label;
	window.opener.postMessage(
		{
			message: 'clicked',
			metaKeyPressed,
			label,
			colZ: column,
		},
		'*',
	);
}

const drawBasicPath = (points, line, name, title) => {
	const path = svg
		.append('path')
		.data([ points ])
		.style('fill', 'none')
		.attr('clip-path', 'url(#clip)')
		.attr('class', name)
		.attr('d', line);
	//find total length of all points of the line chart line
	const totalLength = path.node().getTotalLength();

	//animate the line chart line drawing using path information
	path
		.attr('stroke-dasharray', totalLength + ' ' + totalLength)
		.attr('stroke-dashoffset', totalLength)
		.transition()
		.duration(500)
		.ease(d3.easeLinear)
		.attr('stroke-dashoffset', 0);

	// invisible hitbox
	svg
		.append('path')
		.data([ points ])
		.style('fill', 'none')
		.attr('clip-path', 'url(#clip)')
		.attr('class', `${name}-hitbox`)
		.attr('d', reversedLine)
		.on(`mouseenter`, function() {
			regressionTooltip.transition().duration(200).style('opacity', 0.9);
			regressionTooltip.html(title).style('left', d3.event.pageX + 'px').style('top', d3.event.pageY - 28 + 'px');
		})
		.on(`mouseleave`, function() {
			regressionTooltip.transition().duration(500).style('opacity', 0);
		});
};

// function toggleChartElement(ele, drawLine) {
// 	console.log('top', ele, drawLine);
// 	const outputElement = d3.selectAll(`.${ele.value}`);
// 	const outputElementHitbox = d3.selectAll(`.${ele.value}-hitbox`);
// 	if (outputElement._groups[0].length > 1) {
// 		console.log('already there', outputElement._groups[0].length);
// 		return;
// 	}
// 	console.log('draw');
// 	drawLine();
// 	// if (outputElement) {
// 	// 	outputElement.remove();
// 	// 	outputElementHitbox.remove();
// 	// }
// }

// various chart options checkboxes show/hide fit lines and output
const chartOptionsTemplate = `<details style="text-align: left;" class="analysis-details" open>
<summary class="analysis-summary-title">Chart Options</summary>
<div style="margin-left: 2em;">
  <div><input id="histogram-borders-checkbox" type="checkbox" value="histogramBorders" checked>Histogram Borders</div>
  <br>
  <div><input id="center-poly-checkbox" type="checkbox">Center Polynomial Regressions</div>
  <div><input id="linear-regression-checkbox" type="checkbox" value="linearRegressionLine" checked>Linear Fit <span style="font-size: 1.5em; color: steelblue;">&#9656</span></div>
  <div style="margin-left: 2em;"><input id="confidence-bands-fit-checkbox" type="checkbox" value="confidenceBandsFit">Confid Curves Fit <span style="font-size: 1.5em; color: red;">&#9656</span></div>
  <div style="margin-left: 2em;"><input id="confidence-bands-checkbox" type="checkbox" value="confidenceBands">Confid Curves Indiv <span style="font-size: 1.5em; color: red;">&#9656</span></div>
  <div><input id="degree2-checkbox" type="checkbox" value="degree2PolyLine">Quadratic Fit <span style="font-size: 1.5em; color: green;">&#9656</span></div>
  <div><input id="degree3-checkbox" type="checkbox" value="degree3PolyLine">Cubic Fit <span style="font-size: 1.5em; color: darkmagenta;">&#9656</span></div>
  <div><input id="degree4-checkbox" type="checkbox" value="degree4PolyLine">Quartic Fit <span style="font-size: 1.5em; color: saddlebrown;">&#9656</span></div>
  <div><input id="degree5-checkbox" type="checkbox" value="degree5PolyLine">5th Degree Fit <span style="font-size: 1.5em; color: goldenrod;">&#9656</span></div>
  <div><input id="degree6-checkbox" type="checkbox" value="degree6PolyLine">6th Degree Fit <span style="font-size: 1.5em; color: thistle;">&#9656</span></div>
</div>
</details>`;
