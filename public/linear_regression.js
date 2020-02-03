/*global d3 generateTemplate generateEquationTemplate addOrSubtract*/
/*eslint no-undef: "error"*/
function unload(e) {
	e.preventDefault();
	// Chrome requires returnValue to be set
	e.returnValue = '';
	window.opener.postMessage('closed', '*');
}

window.addEventListener('unload', unload);

const evaluatePValue = (pValue) => (pValue < 0.0001 ? '<0.0001' : pValue);

function onClickSelectCells(thisBar, bar, col) {
	let metaKeyPressed = false;
	if (d3.event.metaKey) {
		metaKeyPressed = true;
	} else {
		// If meta key is not held down, remove other highlighted bars
		d3.selectAll('rect').style('fill', '#69b3a2');
	}
	// TODO: If holding meta key and click on bar again, deselect cells
	// if (metaKeyPressed && thisBar.style("fill") === 'red') {
	//   thisBar.style("fill", "#69b3a2");
	//   window.opener.postMessage({
	//     message: 'unclicked',
	//     metaKeyPressed,
	//     vals: bar,
	//   }, '*');
	//   return;
	// }
	thisBar.style('fill', 'red');
	d3
		.selectAll('.point')
		.style('fill', 'black')
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
		.style('fill', 'red');
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

window.opener.postMessage('ready', '*');

const container = document.getElementById('container');
function receiveMessage(event) {
	console.log('TARGET', event);
	const {
		confUpp,
		confLow,
		meanCiLow,
		meanCiUpp,
		colXLabel,
		colYLabel,
		coordinates,
		corrcoef,
		covariance,
		colAMean,
		colAStdev,
		colBMean,
		colBStdev,
		pValue,
		degree2Poly,
		degree3Poly,
		degree4Poly,
		degree5Poly,
		degree6Poly,
		centeredDegree2Poly,
		centeredDegree3Poly,
		centeredDegree4Poly,
		centeredDegree5Poly,
		centeredDegree6Poly,
		linearRegression,
		linearRegressionLineSlope,
		linearRegressionLineR2,
		linearRegressionLineYIntercept,
	} = event.data;

	const linearRegressionCoefficients = linearRegression['coefficients'];
	const degree2PolyCoefficients = degree2Poly['polynomial'];
	const degree3PolyCoefficients = degree3Poly['polynomial'];
	const degree4PolyCoefficients = degree4Poly['polynomial'];
	const degree5PolyCoefficients = degree5Poly['polynomial'];
	const degree6PolyCoefficients = degree6Poly['polynomial'];
	const centered2PolyCoefficients = centeredDegree2Poly['polynomial'];
	const centered3PolyCoefficients = centeredDegree3Poly['polynomial'];
	const centered4PolyCoefficients = centeredDegree4Poly['polynomial'];
	const centered5PolyCoefficients = centeredDegree5Poly['polynomial'];
	const centered6PolyCoefficients = centeredDegree6Poly['polynomial'];

	const titleEl = document.createElement('div');
	const titleText = document.createTextNode(`Bivariate Fit of ${colYLabel} By ${colXLabel}`);
	titleEl.classList.add('analysis-title');
	titleEl.appendChild(titleText);
	const chartsContainer = document.getElementById('chart');
	document.body.insertBefore(titleEl, chartsContainer);
	// set the dimensions and margins of the graph
	const margin = { top: 100, right: 50, bottom: 20, left: 50 };
	const width = 400;
	const height = 400;
	const svgWidth = width + margin.left + margin.right + 100;
	const svgHeight = height + margin.top + margin.bottom + 100;

	const colA = coordinates.map((a) => a[1]).sort(d3.ascending);
	const colB = coordinates.map((a) => a[0]).sort(d3.ascending);

	const histogramBinTooltip = d3
		.select('body')
		.append('div')
		.attr('class', 'histogram-border tooltip')
		.style('opacity', 0);
	// TODO: Points don't know what row they are in right now. They should.
	const pointTooltip = d3.select('body').append('div').attr('class', 'point tooltip').style('opacity', 0);
	const regressionTooltip = d3
		.select('body')
		.append('div')
		.attr('class', 'regression-line tooltip')
		.style('opacity', 0);

	const svg = d3
		.select('.chart')
		.append('svg')
		.attr('width', svgWidth)
		.attr('height', svgHeight)
		.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	const x = d3.scaleLinear().range([ 0, width ]);
	const y = d3.scaleLinear().range([ height, 0 ]);
	const xAxis = d3.axisBottom().scale(x).ticks(10, 's');
	const yAxis = d3.axisLeft().scale(y).ticks(10, 's');

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
		.text(colXLabel);

	// text label for the y axis
	svg
		.append('text')
		.attr('transform', 'rotate(-90)')
		.attr('y', 0 - margin.left)
		.attr('x', 0 - height / 2)
		.attr('dy', '1em')
		.style('text-anchor', 'middle')
		.text(colYLabel);

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

	// So that lines stay within the bounds of the graph
	svg.append('clipPath').attr('id', 'clip').append('rect').attr('width', width).attr('height', height);

	function drawHistogramBorders() {
		// Histogram Bars
		svg
			.selectAll('xHistBars')
			.data(colBBins)
			.enter()
			.append('rect')
			.on('click', function(d) {
				onClickSelectCells(d3.select(this), d, 'x');
			})
			.on(`mouseover`, function(d) {
				d3.select(this).transition().duration(50).attr('opacity', 0.6);
				histogramBinTooltip.transition().duration(200).style('opacity', 0.9);
				histogramBinTooltip
					.html(d.length)
					.style('left', d3.event.pageX + 'px')
					.style('top', d3.event.pageY - 28 + 'px');
			})
			.on(`mouseout`, function(d) {
				d3.select(this).transition().duration(50).attr('opacity', 1);
				histogramBinTooltip.transition().duration(500).style('opacity', 0);
			})
			.attr('class', 'histogramBorders')
			.attr('fill', '#69b3a2')
			.attr('width', (d) => x(d.x1) - x(d.x0) - 1)
			.attr('x', (d) => x(d.x0))
			.transition()
			.duration(500)
			.delay(function(d, i) {
				return i * 100;
			})
			.attr('y', (d) => barsY(d.length) - height)
			.attr('height', (d) => height - barsY(d.length));
		// Histogram Bars
		svg
			.selectAll('yHistBars')
			.data(colABins)
			.enter()
			.append('rect')
			.on('mouseover', function(d) {
				d3.select(this).transition().duration(50).attr('opacity', 0.6);
				histogramBinTooltip.transition().duration(200).style('opacity', 0.9);
				histogramBinTooltip
					.html(d.length)
					.style('left', d3.event.pageX + 'px')
					.style('top', d3.event.pageY - 28 + 'px');
			})
			.on('mouseout', function(d) {
				d3.select(this).transition().duration(50).attr('opacity', 1);
				histogramBinTooltip.transition().duration(500).style('opacity', 0);
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
			.attr('fill', '#69b3a2');
	}

	// define the line
	const valueLine = d3.line().x((d) => x(d[1])).y((d) => y(d[0]));
	const reversedLine = d3.line().x((d) => x(d[0])).y((d) => y(d[1]));

	//generate n (step) points given some range and equation (ie: y = ax^2+bx+c)
	function createPoints(rangeX, step, equation) {
		return Array.from({ length: Math.round((rangeX[1] - rangeX[0]) / step) || 1 }, function(_, i) {
			const x = rangeX[0] + i * step;
			return [ x, equation(x) ];
		});
	}

	// const centeredX = x - colAMean;

	// const centered2equation = (x) =>
	// 	centered2PolyCoefficients[2] +
	// 	centered2PolyCoefficients[1] * centeredX +
	// 	centered2PolyCoefficients[0] * centeredX * centeredX;
	const linearRegressionEquation = (x) => linearRegressionCoefficients[1] + linearRegressionCoefficients[0] * x;
	const poly2equation = (x) =>
		degree2PolyCoefficients[2] + degree2PolyCoefficients[1] * x + degree2PolyCoefficients[0] * x * x;
	const poly3equation = (x) =>
		degree3PolyCoefficients[3] +
		degree3PolyCoefficients[2] * x +
		degree3PolyCoefficients[1] * x * x +
		degree3PolyCoefficients[0] * x * x * x;
	const poly4equation = (x) =>
		degree4PolyCoefficients[4] +
		degree4PolyCoefficients[3] * x +
		degree4PolyCoefficients[2] * x * x +
		degree4PolyCoefficients[1] * x * x * x +
		degree4PolyCoefficients[0] * x * x * x * x;
	const poly5equation = (x) =>
		degree5PolyCoefficients[5] +
		degree5PolyCoefficients[4] * x +
		degree5PolyCoefficients[3] * x * x +
		degree5PolyCoefficients[2] * x * x * x +
		degree5PolyCoefficients[1] * x * x * x * x +
		degree5PolyCoefficients[0] * x * x * x * x * x;
	const poly6equation = (x) =>
		degree6PolyCoefficients[6] +
		degree6PolyCoefficients[5] * x +
		degree6PolyCoefficients[4] * x * x +
		degree6PolyCoefficients[3] * x * x * x +
		degree6PolyCoefficients[2] * x * x * x * x +
		degree6PolyCoefficients[1] * x * x * x * x * x +
		degree6PolyCoefficients[0] * x * x * x * x * x * x;

	const xDomainMin = x.domain()[0];
	const xDomainMax = x.domain()[1];
	const step = (xDomainMax - xDomainMin) / 200;

	//points
	const linearRegressionPoints = createPoints(x.domain(), step, linearRegressionEquation);
	const degree2Points = createPoints(x.domain(), step, poly2equation);
	const degree3Points = createPoints(x.domain(), step, poly3equation);
	const degree4Points = createPoints(x.domain(), step, poly4equation);
	const degree5Points = createPoints(x.domain(), step, poly5equation);
	const degree6Points = createPoints(x.domain(), step, poly6equation);

	const centeredX = `(${colXLabel} - ${colAMean})`;

	const linearEquationTemplate = `${colYLabel} = ${linearRegressionLineYIntercept.toFixed(6) / 1} ${addOrSubtract(
		linearRegressionLineSlope.toFixed(6) / 1,
	)} ${Math.abs(linearRegressionLineSlope.toFixed(6) / 1)} * ${colXLabel}`;

	const quadraticEquationTemplate = generateEquationTemplate(degree2PolyCoefficients, colXLabel, colYLabel);
	const cubicEquationTemplate = generateEquationTemplate(degree3PolyCoefficients, colXLabel, colYLabel);
	const quarticEquationTemplate = generateEquationTemplate(degree4PolyCoefficients, colXLabel, colYLabel);
	const degree5EquationTemplate = generateEquationTemplate(degree5PolyCoefficients, colXLabel, colYLabel);
	const degree6EquationTemplate = generateEquationTemplate(degree6PolyCoefficients, colXLabel, colYLabel);
	const centeredQuadraticEquationTemplate = generateEquationTemplate(centered2PolyCoefficients, colXLabel, colYLabel);
	const centeredCubicEquationTemplate = generateEquationTemplate(centered3PolyCoefficients, colXLabel, colYLabel);
	const centeredQuarticEquationTemplate = generateEquationTemplate(centered4PolyCoefficients, colXLabel, colYLabel);
	const centeredDegree5EquationTemplate = generateEquationTemplate(centered5PolyCoefficients, colXLabel, colYLabel);
	const centeredDegree6EquationTemplate = generateEquationTemplate(centered6PolyCoefficients, colXLabel, colYLabel);

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

	svg
		.selectAll('.point')
		.data(coordinates)
		.enter()
		.append('circle')
		.attr('class', 'point')
		.attr('r', 2)
		.attr('cy', (d) => y(d[1]))
		.attr('cx', (d) => x(d[0]))
		.on(`mouseenter`, function(d) {
			d3.select(this).transition().duration(50).attr('r', 5);
			pointTooltip.transition().duration(200).style('opacity', 0.9);
			pointTooltip
				.html(`row: ${d[2]}<br>${colXLabel}: ${d[0]}<br>${colYLabel}: ${d[1]}`)
				.style('left', d3.event.pageX + 'px')
				.style('top', d3.event.pageY - 28 + 'px');
		})
		.on(`mouseleave`, function() {
			d3.select(this).transition().duration(50).attr('r', 2);
			pointTooltip.transition().duration(500).style('opacity', 0);
		});

	const summaryStatsTemplate = `
  <details open style="padding: 10px 30px 30px; text-align: center;">
    <summary class="analysis-summary-title">Summary Statistics</summary>
    <div style="display: flex;">
      <table style="width: 300px;">
        <tr>
          <td style="width: 200px;">Pearson's Correlation:</td>
          <td style="width: 100px;">${corrcoef}</td>
        </tr>
        <tr>
          <td style="width: 200px;">p:</td>
          <td style="width: 100px;">${evaluatePValue(pValue)}</td>
        </tr>
        <tr>
          <td style="width: 200px;">Covariance:</td>
          <td style="width: 100px;">${covariance}</td>
        </tr>
        <tr>
          <td style="width: 200px;">Count:</td>
          <td style="width: 100px;">${coordinates.length}</td>
        </tr>
      </table>
      <table style="width: 300px">
        <tr>
          <td style="width: 100px; font-weight: bold;">Variable</td>
          <td style="width: 100px; font-weight: bold;">Mean</td>
          <td style="width: 100px; font-weight: bold;">Std Dev</td>
        </tr>
        <tr>
          <td style="width: 100px;">${colXLabel}</td>
          <td style="width: 100px;">${colAMean}</td>
          <td style="width: 100px;">${colAStdev}</td>
        </tr>
        <tr>
          <td style="width: 100px;">${colYLabel}</td>
          <td style="width: 100px;">${colBMean}</td>
          <td style="width: 100px;">${colBStdev}</td>
        </tr>
      </table>
    </div>
  </details>`;

	const quadraticFitTemplate = generateTemplate(
		'Quadratic Fit',
		'degree2PolyLine',
		quadraticEquationTemplate,
		degree2Poly,
		degree2PolyCoefficients,
		colXLabel,
	);

	const cubicFitTemplate = generateTemplate(
		'Cubic Fit',
		'degree3PolyLine',
		cubicEquationTemplate,
		degree3Poly,
		degree3PolyCoefficients,
		colXLabel,
	);

	const quarticFitTemplate = generateTemplate(
		'Quartic Fit',
		'degree4PolyLine',
		quarticEquationTemplate,
		degree4Poly,
		degree4PolyCoefficients,
		colXLabel,
	);

	const fifthDegreeFitTemplate = generateTemplate(
		'Fifth Degree Fit',
		'degree5PolyLine',
		degree5EquationTemplate,
		degree5Poly,
		degree5PolyCoefficients,
		colXLabel,
	);

	const sixthDegreeFitTemplate = generateTemplate(
		'Sixth Degree Fit',
		'degree6PolyLine',
		degree6EquationTemplate,
		degree6Poly,
		degree6PolyCoefficients,
		colXLabel,
	);

	const centered2DegreeFitTemplate = generateTemplate(
		'Quadratic Fit (centered)',
		'degree2CenteredPolyLine',
		centeredQuadraticEquationTemplate,
		centeredDegree2Poly,
		centered2PolyCoefficients,
		colXLabel,
		centeredX,
	);

	const centered3DegreeFitTemplate = generateTemplate(
		'Cubic Fit (centered)',
		'degree3CenteredPolyLine',
		centeredCubicEquationTemplate,
		centeredDegree3Poly,
		centered3PolyCoefficients,
		colXLabel,
		centeredX,
	);

	const centered4DegreeFitTemplate = generateTemplate(
		'Quartic Fit (centered)',
		'degree4CenteredPolyLine',
		centeredQuarticEquationTemplate,
		centeredDegree4Poly,
		centered4PolyCoefficients,
		colXLabel,
		centeredX,
	);

	const centered5DegreeFitTemplate = generateTemplate(
		'Fifth Degree Fit (centered)',
		'degree5CenteredPolyLine',
		centeredDegree5EquationTemplate,
		centeredDegree5Poly,
		centered5PolyCoefficients,
		colXLabel,
		centeredX,
	);

	const centered6DegreeFitTemplate = generateTemplate(
		'Sixth Degree Fit (centered)',
		'degree6CenteredPolyLine',
		centeredDegree6EquationTemplate,
		centeredDegree6Poly,
		centered6PolyCoefficients,
		colXLabel,
		centeredX,
	);

	const linearFitTemplate = `<details class="analysis-details" open id="linearRegressionLine">
  <summary class="analysis-summary-title">Summary of Linear Fit</summary>
  <table style="width: 100%;">
    <tr>
      <td style="width: 34%;">Equation:</td>
      <td style="width: 66%;">${linearEquationTemplate}</td>
    </tr>
    <tr>
      <td style="width: 34%;">R-squared:</td>
      <td style="width: 66%;">${linearRegressionLineR2}</td>
    </tr>
  </table>
  <h5 style="margin-bottom: 0;">Parameter Estimates</h5>
  <table style="width: 100%;">
    <tr>
      <td style="width: 34%; font-weight: bold;">Term</td>
      <td style="width: 66%; font-weight: bold;">Estimate</td>
    </tr>
    <tr>
      <td style="width: 34%; white-space: nowrap;">Intercept:</td>
      <td style="width: 66%;">${linearRegressionLineYIntercept}</td>
    </tr>
    <tr>
      <td style="width: 34%;">${colXLabel}</td>
      <td style="width: 66%;">${linearRegressionLineSlope.toFixed(6) / 1}</td>
    </tr>
  </table>
</details>`;

	// various chart options checkboxes show/hide fit lines and output
	function toggleChartElement(ele, drawLine) {
		const outputElement = d3.selectAll(`.${ele.value}`);
		const outputElementHitbox = d3.selectAll(`.${ele.value}-hitbox`);
		if (ele.checked) {
			drawLine();
		} else {
			if (outputElement) {
				outputElement.remove();
				outputElementHitbox.remove();
			}
		}
	}

	const chartOptionsTemplate = `<details style="text-align: left;" class="analysis-details" open>
<summary class="analysis-summary-title">Chart Options</summary>
<div style="margin-left: 2em;">
  <div><input id="histogram-borders-checkbox" type="checkbox" value="histogramBorders" onclick="${toggleChartElement(
		this,
	)}" checked>Histogram Borders</div>
  <br>
  <div><input type="checkbox">Center Polynomial Regressions</div>
  <div><input id="linear-regression-checkbox" type="checkbox" value="linearRegressionLine">Linear Fit <span style="font-size: 1.5em; color: steelblue;">&#9656</span></div>
  <div style="margin-left: 2em;"><input id="confidence-bands-fit-checkbox" type="checkbox" value="confidenceBandsFit">Confid Curves Fit <span style="font-size: 1.5em; color: red;">&#9656</span></div>
  <div style="margin-left: 2em;"><input id="confidence-bands-checkbox" type="checkbox" value="confidenceBands">Confid Curves Indiv <span style="font-size: 1.5em; color: red;">&#9656</span></div>
  <div><input id="degree2-checkbox" type="checkbox" value="degree2PolyLine">Quadratic Fit <span style="font-size: 1.5em; color: green;">&#9656</span></div>
  <div><input id="degree3-checkbox" type="checkbox" value="degree3PolyLine">Cubic Fit <span style="font-size: 1.5em; color: darkmagenta;">&#9656</span></div>
  <div><input id="degree4-checkbox" type="checkbox" value="degree4PolyLine">Quartic Fit <span style="font-size: 1.5em; color: saddlebrown;">&#9656</span></div>
  <div><input id="degree5-checkbox" type="checkbox" value="degree5PolyLine">5th Degree Fit <span style="font-size: 1.5em; color: goldenrod;">&#9656</span></div>
  <div><input id="degree6-checkbox" type="checkbox" value="degree6PolyLine">6th Degree Fit <span style="font-size: 1.5em; color: thistle;">&#9656</span></div>
</div>
</details>`;

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
	const chartOptionsParsed = new DOMParser().parseFromString(chartOptionsTemplate, 'text/html');

	document.body.insertBefore(summaryStatsParsed.body.firstChild, chartsContainer);
	container.appendChild(chartOptionsParsed.body.firstChild);
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

	document
		.getElementById('histogram-borders-checkbox')
		.addEventListener('click', (e) => toggleChartElement(e.target, () => drawHistogramBorders()));

	document
		.getElementById('linear-regression-checkbox')
		.addEventListener('click', (e) =>
			toggleChartElement(e.target, () =>
				drawBasicPath(linearRegressionPoints, reversedLine, 'linearRegressionLine', 'Linear Regression Line'),
			),
		);

	document
		.getElementById('degree2-checkbox')
		.addEventListener('click', (e) =>
			toggleChartElement(e.target, () =>
				drawBasicPath(degree2Points, reversedLine, 'degree2PolyLine', 'Quadratic Regression Line'),
			),
		);

	document
		.getElementById('degree3-checkbox')
		.addEventListener('click', (e) =>
			toggleChartElement(e.target, () =>
				drawBasicPath(degree3Points, reversedLine, 'degree3PolyLine', 'Cubic Regression Line'),
			),
		);

	document
		.getElementById('degree4-checkbox')
		.addEventListener('click', (e) =>
			toggleChartElement(e.target, () =>
				drawBasicPath(degree4Points, reversedLine, 'degree4PolyLine', 'Quartic Regression Line'),
			),
		);

	document
		.getElementById('degree5-checkbox')
		.addEventListener('click', (e) =>
			toggleChartElement(e.target, () =>
				drawBasicPath(degree5Points, reversedLine, 'degree5PolyLine', 'Fifth Degree Regression Line'),
			),
		);

	document
		.getElementById('degree6-checkbox')
		.addEventListener('click', (e) =>
			toggleChartElement(e.target, () =>
				drawBasicPath(degree6Points, reversedLine, 'degree6PolyLine', 'Sixth Degree Regression Line'),
			),
		);

	document
		.getElementById('confidence-bands-checkbox')
		.addEventListener('click', (e) =>
			toggleChartElement(e.target, () => drawBasicPath(confUpp, valueLine, 'confidenceBands', null)),
		);
	document
		.getElementById('confidence-bands-checkbox')
		.addEventListener('click', (e) =>
			toggleChartElement(e.target, () => drawBasicPath(confLow, valueLine, 'confidenceBands', null)),
		);

	document
		.getElementById('confidence-bands-fit-checkbox')
		.addEventListener('click', (e) =>
			toggleChartElement(e.target, () => drawBasicPath(meanCiUpp, valueLine, 'confidenceBandsFit', null)),
		);

	document
		.getElementById('confidence-bands-fit-checkbox')
		.addEventListener('click', (e) =>
			toggleChartElement(e.target, () => drawBasicPath(meanCiLow, valueLine, 'confidenceBandsFit', null)),
		);
}
window.addEventListener('message', receiveMessage, false);
