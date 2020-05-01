/*global d3 clickedBarPointSize highlightedPointColor highlightedPointSize normalPointSize normalBarFill createPoints reversedLine valueLine drawBasicPath toggleChartElement generateRegressionTemplate generateEquationTemplate addOrSubtract unload evaluatePValue toggleCenteredPoly onClickSelectCells chartOptionsTemplate*/
window.addEventListener('unload', unload);
window.opener.postMessage('ready', '*');

// magic linear regression globals
const margin = { top: 100, right: 50, bottom: 20, left: 50 };
const width = 400;
const height = 400;
const svgWidth = width + margin.left + margin.right + 100;
const svgHeight = height + margin.top + margin.bottom + 100;
const container = document.getElementById('container');

const svg = d3
	.select('.chart')
	.append('svg')
	.attr('width', svgWidth)
	.attr('height', svgHeight)
	.append('g')
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// So that lines stay within the bounds of the graph
svg.append('clipPath').attr('id', 'clip').append('rect').attr('width', width).attr('height', height);

const histogramBinTooltip = d3
	.select('body')
	.append('div')
	.attr('class', 'histogram-border tooltip')
	.style('opacity', 0);
const pointTooltip = d3.select('body').append('div').attr('class', 'point tooltip').style('opacity', 0);
const x = d3.scaleLinear().range([ 0, width ]);
const y = d3.scaleLinear().range([ height, 0 ]);
// define the line
const valueLine = d3.line().x((d) => x(d[1])).y((d) => y(d[0]));
const reversedLine = d3.line().x((d) => x(d[0])).y((d) => y(d[1]));

const xAxis = d3.axisBottom().scale(x).ticks(10, 's');
const yAxis = d3.axisLeft().scale(y).ticks(10, 's');

function receiveMessage(event) {
	console.log('TARGET', event);
	const {
		colX,
		colY,
		colXMean,
		colYMean,
		coordinates,
		reg1,
		reg2,
		reg3,
		reg4,
		reg5,
		reg6,
		cent_reg2,
		cent_reg3,
		cent_reg4,
		cent_reg5,
		cent_reg6,
		corrcoef,
		cov,
		std_x,
		std_y,
	} = event.data;

	// const sortedCiUpp = [ ...confUpp ].sort((a, b) => a[1] - b[1]);
	// const sortedCiLow = [ ...confLow ].sort((a, b) => a[1] - b[1]);
	// const sortedMeanCiUpp = [ ...meanCiUpp ].sort((a, b) => a[1] - b[1]);
	// const sortedMeanCiLow = [ ...meanCiLow ].sort((a, b) => a[1] - b[1]);
	const linearRegressionCoefficients = reg1.stats['polynomial'];
	const degree2PolyCoefficients = reg2.stats['polynomial'];
	const degree3PolyCoefficients = reg3.stats['polynomial'];
	const degree4PolyCoefficients = reg4.stats['polynomial'];
	const degree5PolyCoefficients = reg5.stats['polynomial'];
	const degree6PolyCoefficients = reg6.stats['polynomial'];
	const centered2PolyCoefficients = cent_reg2.stats['polynomial'];
	const centered3PolyCoefficients = cent_reg3.stats['polynomial'];
	const centered4PolyCoefficients = cent_reg4.stats['polynomial'];
	const centered5PolyCoefficients = cent_reg5.stats['polynomial'];
	const centered6PolyCoefficients = cent_reg6.stats['polynomial'];
	const titleEl = document.createElement('div');
	const titleText = document.createTextNode(
		`Bivariate Fit of ${colY.label} ${colY.units ? '(' + colY.units + ')' : ''} By ${colX.label} ${colX.units
			? '(' + colX.units + ')'
			: ''}`,
	);
	titleEl.classList.add('analysis-title');
	titleEl.appendChild(titleText);
	const chartsContainer = document.getElementById('chart');
	document.body.insertBefore(titleEl, chartsContainer);

	const colA = coordinates.map((a) => a[1]).sort(d3.ascending);
	const colB = coordinates.map((a) => a[0]).sort(d3.ascending);

	// get extents and range
	const xExtent = d3.extent(coordinates, function(d) {
		return d[0];
	});
	const xRange = xExtent[1] - xExtent[0];
	const yExtent = d3.extent(coordinates, function(d) {
		return d[1];
	});
	const yRange = yExtent[1] - yExtent[0];

	// set domain to be extent +- 5%
	x.domain([ xExtent[0] - xRange * 0.05, xExtent[1] + xRange * 0.05 ]).nice();
	y.domain([ yExtent[0] - yRange * 0.05, yExtent[1] + yRange * 0.05 ]).nice();

	// draw axes
	svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height + ')').call(xAxis);
	svg.append('g').attr('class', 'y axis').call(yAxis);

	// text label for the x axis
	svg
		.append('text')
		.attr('transform', 'translate(' + width / 2 + ' ,' + (height + 50) + ')')
		.style('text-anchor', 'middle')
		.text(colX.label);

	// text label for the y axis
	svg
		.append('text')
		.attr('transform', 'rotate(-90)')
		.attr('y', 0 - margin.left)
		.attr('x', 0 - height / 2)
		.attr('dy', '1em')
		.style('text-anchor', 'middle')
		.text(colY.label);

	// Histogram borders. Lower number = higher bars
	const barHeight = 150;
	const barsY = d3.scaleLinear().range([ height, barHeight ]);
	barsY.domain([ 0, colA.length ]);
	const barsX = d3.scaleLinear().range([ 0, 250 ]);
	barsX.domain([ 0, colB.length ]);

	// set the parameters for the histogram
	const histogramY = d3
		.histogram()
		.domain(y.domain()) // then the domain of the graphic
		.thresholds(8); // then the numbers of bins

	const histogramX = d3
		.histogram()
		.domain(x.domain()) // then the domain of the graphic
		.thresholds(8); // then the numbers of bins

	// And apply this function to data to get the bins
	const colABins = histogramY(colA);
	const colBBins = histogramX(colB);

	function onMouseOverHistogramBar(d, thisBar) {
		d3.select(thisBar).transition().duration(50).attr('opacity', 0.6);
		histogramBinTooltip.transition().duration(200).style('opacity', 0.9);
		histogramBinTooltip.html(d.length).style('left', d3.event.pageX + 'px').style('top', d3.event.pageY - 28 + 'px');
	}

	function onMouseOutHistogramBar(d, thisBar) {
		d3.select(thisBar).transition().duration(50).attr('opacity', 1);
		histogramBinTooltip.transition().duration(500).style('opacity', 0);
	}

	function drawHistogramBorders() {
		// Histogram Bar X axis
		svg
			.selectAll('xHistBars')
			.data(colBBins)
			.enter()
			.append('rect')
			.on('click', function(d) {
				onClickSelectCells(d3.select(this), d, 'x');
			})
			.on(`mouseover`, function(d) {
				onMouseOverHistogramBar(d, this);
			})
			.on(`mouseout`, function(d) {
				onMouseOutHistogramBar(d, this);
			})
			.attr('class', 'histogramBorders')
			.attr('fill', normalBarFill)
			.attr('width', (d) => x(d.x1) - x(d.x0) - 1)
			.attr('x', (d) => x(d.x0))
			.transition()
			.duration(500)
			.delay(function(d, i) {
				return i * 100;
			})
			.attr('y', (d) => barsY(d.length) - height)
			.attr('height', (d) => height - barsY(d.length));

		// Histogram Bar Y Axis
		svg
			.selectAll('yHistBars')
			.data(colABins)
			.enter()
			.append('rect')
			.on(`mouseover`, function(d) {
				onMouseOverHistogramBar(d, this);
			})
			.on(`mouseout`, function(d) {
				onMouseOutHistogramBar(d, this);
			})
			.on('click', function(d) {
				onClickSelectCells(d3.select(this), d, 'y');
			})
			.attr('class', 'histogramBorders')
			.attr('x', 405)
			.attr('y', (d) => y(d.x1))
			.attr('height', (d) => y(d.x0) - y(d.x1) - 1)
			.transition()
			.duration(500)
			.delay(function(d, i) {
				return i * 100;
			})
			.attr('width', (d) => barsX(d.length))
			.attr('fill', normalBarFill);
	}

	const linearRegressionEquation = (x) => linearRegressionCoefficients[0] + linearRegressionCoefficients[1] * x;
	const poly2equation = (x) =>
		degree2PolyCoefficients[0] + degree2PolyCoefficients[1] * x + degree2PolyCoefficients[2] * x * x;
	const poly3equation = (x) =>
		degree3PolyCoefficients[0] +
		degree3PolyCoefficients[1] * x +
		degree3PolyCoefficients[2] * x * x +
		degree3PolyCoefficients[3] * x * x * x;
	const poly4equation = (x) =>
		degree4PolyCoefficients[0] +
		degree4PolyCoefficients[1] * x +
		degree4PolyCoefficients[2] * x * x +
		degree4PolyCoefficients[3] * x * x * x +
		degree4PolyCoefficients[4] * x * x * x * x;
	const poly5equation = (x) =>
		degree5PolyCoefficients[0] +
		degree5PolyCoefficients[1] * x +
		degree5PolyCoefficients[2] * x * x +
		degree5PolyCoefficients[3] * x * x * x +
		degree5PolyCoefficients[4] * x * x * x * x +
		degree5PolyCoefficients[5] * x * x * x * x * x;
	const poly6equation = (x) =>
		degree6PolyCoefficients[0] +
		degree6PolyCoefficients[1] * x +
		degree6PolyCoefficients[2] * x * x +
		degree6PolyCoefficients[3] * x * x * x +
		degree6PolyCoefficients[4] * x * x * x * x +
		degree6PolyCoefficients[5] * x * x * x * x * x +
		degree6PolyCoefficients[6] * x * x * x * x * x * x;

	const xDomainMin = x.domain()[0];
	const xDomainMax = x.domain()[1];
	const step = (xDomainMax - xDomainMin) / 200;

	//points
	const linearRegressionPoints = createPoints(x.domain(), step, linearRegressionEquation);
	console.log(linearRegressionPoints);
	const degree2Points = createPoints(x.domain(), step, poly2equation);
	const degree3Points = createPoints(x.domain(), step, poly3equation);
	const degree4Points = createPoints(x.domain(), step, poly4equation);
	const degree5Points = createPoints(x.domain(), step, poly5equation);
	const degree6Points = createPoints(x.domain(), step, poly6equation);

	const linearEquationTemplate = `${colY.label} = ${linearRegressionCoefficients[1].toFixed(6) / 1} ${addOrSubtract(
		linearRegressionCoefficients[0].toFixed(6) / 1,
	)} ${Math.abs(linearRegressionCoefficients[0].toFixed(6) / 1)} * ${colX.label}`;
	const quadraticEquationTemplate = generateEquationTemplate(degree2PolyCoefficients, colX.label, colY.label);
	const cubicEquationTemplate = generateEquationTemplate(degree3PolyCoefficients, colX.label, colY.label);
	const quarticEquationTemplate = generateEquationTemplate(degree4PolyCoefficients, colX.label, colY.label);
	const degree5EquationTemplate = generateEquationTemplate(degree5PolyCoefficients, colX.label, colY.label);
	const degree6EquationTemplate = generateEquationTemplate(degree6PolyCoefficients, colX.label, colY.label);
	const centeredQuadraticEquationTemplate = generateEquationTemplate(centered2PolyCoefficients, colX.label, colY.label);
	const centeredCubicEquationTemplate = generateEquationTemplate(centered3PolyCoefficients, colX.label, colY.label);
	const centeredQuarticEquationTemplate = generateEquationTemplate(centered4PolyCoefficients, colX.label, colY.label);
	const centeredDegree5EquationTemplate = generateEquationTemplate(centered5PolyCoefficients, colX.label, colY.label);
	const centeredDegree6EquationTemplate = generateEquationTemplate(centered6PolyCoefficients, colX.label, colY.label);

	function onMouseEnterPoint(d, thisPoint) {
		d3.select(thisPoint).transition().duration(50).attr('r', highlightedPointSize);
		pointTooltip.transition().duration(200).style('opacity', 0.9);
		pointTooltip
			.html(`row: ${d[2]}<br>${colX.label}: ${d[0]}<br>${colY.label}: ${d[1]}`)
			.style('left', d3.event.pageX + 'px')
			.style('top', d3.event.pageY - 28 + 'px');
	}

	function onMouseLeavePoint(d, thisPoint) {
		if (d3.select(thisPoint).style('fill') === highlightedPointColor) {
			d3.select(thisPoint).transition().duration(50).attr('r', clickedBarPointSize);
		} else {
			d3.select(thisPoint).transition().duration(50).attr('r', normalPointSize);
		}
		pointTooltip.transition().duration(500).style('opacity', 0);
	}

	// TODO remove "magic numbers"
	svg
		.selectAll('.point')
		.data(coordinates)
		.enter()
		.append('circle')
		.attr('class', 'point')
		.attr('r', normalPointSize)
		.attr('cy', (d) => y(d[1]))
		.attr('cx', (d) => x(d[0]))
		.on(`mouseenter`, function(d) {
			onMouseEnterPoint(d, this);
		})
		.on(`mouseleave`, function(d) {
			onMouseLeavePoint(d, this);
		});

	const summaryStatsTemplate = `
  <details open style="padding: 10px 30px 30px; text-align: center;">
    <summary class="analysis-summary-title">Summary Statistics</summary>
    <div style="display: flex;">
    <table style="width: 300px; margin-right: 20px;">
      <tr>
        <td class="table-header large">Statistic</td>
        <td class="table-header right small">Value</td>
      </tr>
      <tr>
        <td class="header-background large">Pearson's Correlation</td>
        <td class="right small">${corrcoef[0][1].toFixed(4) / 1}</td>
      </tr>
      <tr>
        <td class="header-background large">p</td>
        <td class="right small">${evaluatePValue(reg1.stats.pvalues[0])}</td>
      </tr>
      <tr>
        <td class="header-background large">Covariance</td>
        <td class="right small">${cov[0][1].toFixed(4) / 1}</td>
      </tr>
      <tr>
        <td class="header-background large">Count</td>
        <td class="right small">${coordinates.length}</td>
      </tr>
    </table>
      <table style="width: 400px">
        <tr>
          <td class="table-header large">Variable</td>
          <td class="table-header small right">Mean</td>
          <td class="table-header small right">Std Dev</td>
        </tr>
        <tr>
          <td class="header-background left large">${colX.label}</td>
          <td class="right small">${colXMean.toFixed(4) / 1}</td>
          <td class="right small">${std_x.toFixed(4) / 1}</td>
        </tr>
        <tr>
          <td class="header-background left large">${colY.label}</td>
          <td class="right small">${colYMean.toFixed(4) / 1}</td>
          <td class="right small">${std_y.toFixed(4) / 1}</td>
        </tr>
      </table>
    </div>
  </details>`;

	const linearFitTemplate = generateRegressionTemplate(
		'Linear Fit',
		'linearRegressionLine',
		null,
		linearEquationTemplate,
		reg1.stats,
		linearRegressionCoefficients,
		colX.label,
	);

	const quadraticFitTemplate = generateRegressionTemplate(
		'Quadratic Fit',
		'degree2PolyLine',
		'uncentered',
		quadraticEquationTemplate,
		reg2.stats,
		degree2PolyCoefficients,
		colX.label,
	);

	const cubicFitTemplate = generateRegressionTemplate(
		'Cubic Fit',
		'degree3PolyLine',
		'uncentered',
		cubicEquationTemplate,
		reg3.stats,
		degree3PolyCoefficients,
		colX.label,
	);

	const quarticFitTemplate = generateRegressionTemplate(
		'Quartic Fit',
		'degree4PolyLine',
		'uncentered',
		quarticEquationTemplate,
		reg4.stats,
		degree4PolyCoefficients,
		colX.label,
	);

	const fifthDegreeFitTemplate = generateRegressionTemplate(
		'Fifth Degree Fit',
		'degree5PolyLine',
		'uncentered',
		degree5EquationTemplate,
		reg5.stats,
		degree5PolyCoefficients,
		colX.label,
	);

	const sixthDegreeFitTemplate = generateRegressionTemplate(
		'Sixth Degree Fit',
		'degree6PolyLine',
		'uncentered',
		degree6EquationTemplate,
		reg6.stats,
		degree6PolyCoefficients,
		colX.label,
	);

	const centeredX = `(${colX.label} - ${colXMean})`;

	const centered2DegreeFitTemplate = generateRegressionTemplate(
		'Quadratic Fit (centered)',
		'degree2CenteredPolyLine',
		'centered',
		centeredQuadraticEquationTemplate,
		cent_reg2.stats,
		centered2PolyCoefficients,
		colX.label,
		centeredX,
	);

	const centered3DegreeFitTemplate = generateRegressionTemplate(
		'Cubic Fit (centered)',
		'degree3CenteredPolyLine',
		'centered',
		centeredCubicEquationTemplate,
		cent_reg3.stats,
		centered3PolyCoefficients,
		colX.label,
		centeredX,
	);

	const centered4DegreeFitTemplate = generateRegressionTemplate(
		'Quartic Fit (centered)',
		'degree4CenteredPolyLine',
		'centered',
		centeredQuarticEquationTemplate,
		cent_reg4.stats,
		centered4PolyCoefficients,
		colX.label,
		centeredX,
	);

	const centered5DegreeFitTemplate = generateRegressionTemplate(
		'Fifth Degree Fit (centered)',
		'degree5CenteredPolyLine',
		'centered',
		centeredDegree5EquationTemplate,
		cent_reg5.stats,
		centered5PolyCoefficients,
		colX.label,
		centeredX,
	);

	const centered6DegreeFitTemplate = generateRegressionTemplate(
		'Sixth Degree Fit (centered)',
		'degree6CenteredPolyLine',
		'centered',
		centeredDegree6EquationTemplate,
		cent_reg6.stats,
		centered6PolyCoefficients,
		colX.label,
		centeredX,
	);

	const chartOptionsDropdown = `<div style="text-align: center;">
  <h3>Chart Options</h3>
    <select id="chart-options-dropdown" multiple>
      <optgroup>
        <option value="histogramBorders" selected>Histogram Borders</option>
        <option value="centerPoly">Center Polynomial Regressions</option>
      </optgroup>
      <optgroup>
        <option value="linearRegressionLine" selected>Linear Fit</option>
        <option value="degree2PolyLine">Quadratic Fit</option>
        <option value="degree3PolyLine">Cubic Fit</option>
        <option value="degree4PolyLine">4th degree Fit</option>
        <option value="degree5PolyLine">5th degree Fit</option>
        <option value="degree6PolyLine">6th degree Fit</option>
      </optgroup>
      <optgroup>
        <option value="confidenceBandsFit">Confidence Curves (fit)</option>
        <option value="confidenceBands">Confidence curves</option>
      </optgroup>
  </select>
</div>`;

	const saveResidualsButton = `<button style="margin-top: 1em;" id="saveResiduals">Save Residuals</button>`;
	const summaryStatsParsed = new DOMParser().parseFromString(summaryStatsTemplate, 'text/html');
	const linearFitParsed = new DOMParser().parseFromString(linearFitTemplate, 'text/html');
	const quadraticFitParsed = new DOMParser().parseFromString(quadraticFitTemplate, 'text/html');
	const cubicFitParsed = new DOMParser().parseFromString(cubicFitTemplate, 'text/html');
	const quarticFitParsed = new DOMParser().parseFromString(quarticFitTemplate, 'text/html');
	const fifthDegreeFitParsed = new DOMParser().parseFromString(fifthDegreeFitTemplate, 'text/html');
	const sixthDegreeFitParsed = new DOMParser().parseFromString(sixthDegreeFitTemplate, 'text/html');
	const centeredQuadraticFitParsed = new DOMParser().parseFromString(centered2DegreeFitTemplate, 'text/html');
	const centeredCubicFitParsed = new DOMParser().parseFromString(centered3DegreeFitTemplate, 'text/html');
	const centeredQuarticFitParsed = new DOMParser().parseFromString(centered4DegreeFitTemplate, 'text/html');
	const centeredFifthDegreeFitParsed = new DOMParser().parseFromString(centered5DegreeFitTemplate, 'text/html');
	const centeredSixthDegreeFitParsed = new DOMParser().parseFromString(centered6DegreeFitTemplate, 'text/html');
	const chartOptionsDropdownParsed = new DOMParser().parseFromString(chartOptionsDropdown, 'text/html');
	const saveResidualsButtonParsed = new DOMParser().parseFromString(saveResidualsButton, 'text/html');

	document.body.insertBefore(summaryStatsParsed.body.firstChild, chartsContainer);
	container.appendChild(chartOptionsDropdownParsed.body.firstChild);
	container.appendChild(saveResidualsButtonParsed.body.firstChild);
	container.appendChild(linearFitParsed.body.firstChild);
	container.appendChild(quadraticFitParsed.body.firstChild);
	container.appendChild(cubicFitParsed.body.firstChild);
	container.appendChild(quarticFitParsed.body.firstChild);
	container.appendChild(fifthDegreeFitParsed.body.firstChild);
	container.appendChild(sixthDegreeFitParsed.body.firstChild);
	container.appendChild(centeredQuadraticFitParsed.body.firstChild);
	container.appendChild(centeredCubicFitParsed.body.firstChild);
	container.appendChild(centeredQuarticFitParsed.body.firstChild);
	container.appendChild(centeredFifthDegreeFitParsed.body.firstChild);
	container.appendChild(centeredSixthDegreeFitParsed.body.firstChild);
	window.removeEventListener('message', receiveMessage);

	new SlimSelect({
		select: '#chart-options-dropdown',
		onChange: (info) => {
			function showCenteredPoly(uncenteredClassName, centeredClassName) {
				if (centerPoly) {
					document.getElementById(centeredClassName).style.display = 'block';
					document.getElementById(uncenteredClassName).style.display = 'none';
				} else {
					document.getElementById(centeredClassName).style.display = 'none';
					document.getElementById(uncenteredClassName).style.display = 'block';
				}
			}
			const histogramBorders = info.find((inf) => inf.value === 'histogramBorders');
			const centerPoly = info.find((inf) => inf.value === 'centerPoly');
			const linearRegressionLine = info.find((inf) => inf.value === 'linearRegressionLine');
			const degree2Poly = info.find((inf) => inf.value === 'degree2PolyLine');
			const degree3Poly = info.find((inf) => inf.value === 'degree3PolyLine');
			const degree4Poly = info.find((inf) => inf.value === 'degree4PolyLine');
			const degree5Poly = info.find((inf) => inf.value === 'degree5PolyLine');
			const degree6Poly = info.find((inf) => inf.value === 'degree6PolyLine');
			// const confidenceBands = info.find((inf) => inf.value === 'confidenceBands');
			// const confidenceBandsFit = info.find((inf) => inf.value === 'confidenceBandsFit');
			if (histogramBorders) {
				drawHistogramBorders();
			} else {
				d3.selectAll(`.histogramBorders`).remove();
			}
			if (linearRegressionLine) {
				drawBasicPath(linearRegressionPoints, reversedLine, 'linearRegressionLine', 'Linear Regression Line');
				document.getElementById('linearRegressionLine').style.display = 'block';
			} else {
				d3.selectAll(`.linearRegressionLine`).remove();
				d3.selectAll(`.linearRegressionLine-hitbox`).remove();
				document.getElementById('linearRegressionLine').style.display = 'none';
			}
			if (degree2Poly) {
				drawBasicPath(degree2Points, reversedLine, 'degree2PolyLine', 'Quadratic Regression Line');
				showCenteredPoly('degree2PolyLine', 'degree2CenteredPolyLine');
			} else {
				d3.selectAll(`.degree2PolyLine`).remove();
				d3.selectAll(`.degree2PolyLine-hitbox`).remove();
				document.getElementById('degree2CenteredPolyLine').style.display = 'none';
				document.getElementById('degree2PolyLine').style.display = 'none';
			}
			if (degree3Poly) {
				drawBasicPath(degree3Points, reversedLine, 'degree3PolyLine', 'Cubic Regression Line');
				showCenteredPoly('degree3PolyLine', 'degree3CenteredPolyLine');
			} else {
				d3.selectAll(`.degree3PolyLine`).remove();
				d3.selectAll(`.degree3PolyLine-hitbox`).remove();
				document.getElementById('degree3CenteredPolyLine').style.display = 'none';
				document.getElementById('degree3PolyLine').style.display = 'none';
			}
			if (degree4Poly) {
				drawBasicPath(degree4Points, reversedLine, 'degree4PolyLine', 'Quartic Regression Line');
				showCenteredPoly('degree4PolyLine', 'degree4CenteredPolyLine');
			} else {
				d3.selectAll(`.degree4PolyLine`).remove();
				d3.selectAll(`.degree4PolyLine-hitbox`).remove();
				document.getElementById('degree4CenteredPolyLine').style.display = 'none';
				document.getElementById('degree4PolyLine').style.display = 'none';
			}
			if (degree5Poly) {
				drawBasicPath(degree5Points, reversedLine, 'degree5PolyLine', '5th Degree Regression Line');
				showCenteredPoly('degree5PolyLine', 'degree5CenteredPolyLine');
			} else {
				d3.selectAll(`.degree5PolyLine`).remove();
				d3.selectAll(`.degree5PolyLine-hitbox`).remove();
				document.getElementById('degree5CenteredPolyLine').style.display = 'none';
				document.getElementById('degree5PolyLine').style.display = 'none';
			}
			if (degree6Poly) {
				drawBasicPath(degree6Points, reversedLine, 'degree6PolyLine', '6th Degree Regression Line');
				showCenteredPoly('degree6PolyLine', 'degree6CenteredPolyLine');
			} else {
				d3.selectAll(`.degree6PolyLine`).remove();
				d3.selectAll(`.degree6PolyLine-hitbox`).remove();
				document.getElementById('degree6CenteredPolyLine').style.display = 'none';
				document.getElementById('degree6PolyLine').style.display = 'none';
			}
			// if (confidenceBands) {
			// 	drawBasicPath(sortedCiUpp, valueLine, 'confidenceBands', null);
			// 	drawBasicPath(sortedCiLow, valueLine, 'confidenceBands', null);
			// } else {
			// 	d3.selectAll(`.confidenceBands`).remove();
			// 	d3.selectAll(`.confidenceBands-hitbox`).remove();
			// }
			// if (confidenceBandsFit) {
			// 	drawBasicPath(sortedMeanCiUpp, valueLine, 'confidenceBandsFit', null);
			// 	drawBasicPath(sortedMeanCiLow, valueLine, 'confidenceBandsFit', null);
			// } else {
			// 	d3.selectAll(`.confidenceBandsFit`).remove();
			// 	d3.selectAll(`.confidenceBandsFit-hitbox`).remove();
			// }
		},
	});

	function onClickSaveResiduals() {
		window.opener.postMessage(
			{
				message: 'save-residuals',
				residuals: reg1.stats.residuals,
			},
			'*',
		);
	}

	document.getElementById('saveResiduals').addEventListener('click', (e) => onClickSaveResiduals());

	drawHistogramBorders();
	drawBasicPath(linearRegressionPoints, reversedLine, 'linearRegressionLine', 'Linear Regression Line');
}
window.addEventListener('message', receiveMessage, false);
