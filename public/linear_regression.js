function unload(e) {
	e.preventDefault();
	// Chrome requires returnValue to be set
	e.returnValue = '';
	window.opener.postMessage('closed', '*');
}

window.addEventListener('unload', unload);

const evaluatePValue = (pValue) => (pValue < 0.0001 ? '<0.0001' : pValue);

// various chart options checkboxes show/hide fit lines and output
function toggleChartElement(ele) {
	const outputElement = document.getElementById(ele.value);
	if (ele.checked) {
		d3.selectAll(`.${ele.value}`).attr('display', 'block');
		d3.selectAll(`.${ele.value}-hitbox`).attr('display', 'block');
		if (outputElement) {
			outputElement.style.display = 'block';
		}
	} else {
		d3.selectAll(`.${ele.value}`).attr('display', 'none');
		d3.selectAll(`.${ele.value}-hitbox`).attr('display', 'none');
		if (outputElement) {
			outputElement.style.display = 'none';
		}
	}
}

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

const addOrSubtract = (value) => (value >= 0 ? '+' : '-');

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
		linearRegressionLineSlope,
		linearRegressionLineR2,
		linearRegressionLineYIntercept,
	} = event.data;

	const degree2PolyCoefficients = degree2Poly['polynomial'];
	const degree3PolyCoefficients = degree3Poly['polynomial'];
	const degree4PolyCoefficients = degree4Poly['polynomial'];
	const degree5PolyCoefficients = degree5Poly['polynomial'];
	const degree6PolyCoefficients = degree6Poly['polynomial'];

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

	// Histogram Bars
	svg
		.selectAll('xHistBars')
		.data(colBBins)
		.enter()
		.append('rect')
		.attr('class', 'histogramBorders')
		.attr('x', (d) => x(d.x0))
		.attr('y', (d) => barsY(d.length) - height)
		.attr('height', (d) => height - barsY(d.length))
		.attr('width', (d) => x(d.x1) - x(d.x0) - 1)
		.attr('fill', '#69b3a2')
		.on(`mouseenter`, function(d) {
			d3.select(this).transition().duration(50).attr('opacity', 0.6);
			histogramBinTooltip.transition().duration(200).style('opacity', 0.9);
			histogramBinTooltip.html(d.length).style('left', d3.event.pageX + 'px').style('top', d3.event.pageY - 28 + 'px');
		})
		.on(`mouseleave`, function(d) {
			d3.select(this).transition().duration(50).attr('opacity', 1);
			histogramBinTooltip.transition().duration(500).style('opacity', 0);
		})
		.on('click', function(d) {
			onClickSelectCells(d3.select(this), d, 'x');
		});

	// Histogram Bars
	svg
		.selectAll('yHistBars')
		.data(colABins)
		.enter()
		.append('rect')
		.attr('class', 'histogramBorders')
		.attr('x', 425)
		.attr('y', (d) => y(d.x1))
		.attr('height', (d) => y(d.x0) - y(d.x1) - 1)
		.attr('width', (d) => barsX(d.length))
		.attr('fill', '#69b3a2')
		.on('mouseover', function(d) {
			d3.select(this).transition().duration(50).attr('opacity', 0.6);
			histogramBinTooltip.transition().duration(200).style('opacity', 0.9);
			histogramBinTooltip.html(d.length).style('left', d3.event.pageX + 'px').style('top', d3.event.pageY - 28 + 'px');
		})
		.on('mouseout', function(d) {
			d3.select(this).transition().duration(50).attr('opacity', 1);
			histogramBinTooltip.transition().duration(500).style('opacity', 0);
		})
		.on('click', function(d) {
			onClickSelectCells(d3.select(this), d, 'y');
		});

	// define the line
	const valueline = d3.line().x((d) => x(d[1])).y((d) => y(d[0]));
	const reversedLine = d3.line().x((d) => x(d[0])).y((d) => y(d[1]));

	//generate n (step) points given some range and equation (ie: y = ax^2+bx+c)
	function createPoints(rangeX, step, equation) {
		return Array.from({ length: Math.round((rangeX[1] - rangeX[0]) / step) || 1 }, function(_, i) {
			const x = rangeX[0] + i * step;
			return [ x, equation(x) ];
		});
	}

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
	const degree2Points = createPoints(x.domain(), step, poly2equation);
	const degree3Points = createPoints(x.domain(), step, poly3equation);
	const degree4Points = createPoints(x.domain(), step, poly4equation);
	const degree5Points = createPoints(x.domain(), step, poly5equation);
	const degree6Points = createPoints(x.domain(), step, poly6equation);

	svg
		.append('path')
		.data([ degree2Points ])
		.style('fill', 'none')
		.attr('clip-path', 'url(#clip)')
		.attr('class', 'degree2PolyLine')
		.attr('d', reversedLine);

	// invisible hitbox
	svg
		.append('path')
		.data([ degree2Points ])
		.style('fill', 'none')
		.attr('clip-path', 'url(#clip)')
		.attr('class', 'degree2PolyLine-hitbox')
		.attr('d', reversedLine)
		.on(`mouseenter`, function() {
			regressionTooltip.transition().duration(200).style('opacity', 0.9);
			regressionTooltip
				.html('Quadratic Regression Line')
				.style('left', d3.event.pageX + 'px')
				.style('top', d3.event.pageY - 28 + 'px');
		})
		.on(`mouseleave`, function() {
			regressionTooltip.transition().duration(500).style('opacity', 0);
		});

	svg
		.append('path')
		.data([ degree3Points ])
		.style('fill', 'none')
		.attr('clip-path', 'url(#clip)')
		.attr('class', 'degree3PolyLine')
		.attr('d', reversedLine);

	svg
		.append('path')
		.data([ degree3Points ])
		.style('fill', 'none')
		.attr('clip-path', 'url(#clip)')
		.attr('class', 'degree3PolyLine-hitbox')
		.attr('d', reversedLine)
		.on(`mouseenter`, function() {
			regressionTooltip.transition().duration(200).style('opacity', 0.9);
			regressionTooltip
				.html('Cubic Regression Line')
				.style('left', d3.event.pageX + 'px')
				.style('top', d3.event.pageY - 28 + 'px');
		})
		.on(`mouseleave`, function() {
			regressionTooltip.transition().duration(500).style('opacity', 0);
		});

	svg
		.append('path')
		.data([ degree4Points ])
		.style('fill', 'none')
		.attr('clip-path', 'url(#clip)')
		.attr('class', 'degree4PolyLine')
		.attr('d', reversedLine);

	svg
		.append('path')
		.data([ degree4Points ])
		.style('fill', 'none')
		.attr('clip-path', 'url(#clip)')
		.attr('class', 'degree4PolyLine-hitbox')
		.attr('d', reversedLine)
		.on(`mouseenter`, function() {
			regressionTooltip.transition().duration(200).style('opacity', 0.9);
			regressionTooltip
				.html('Quartic Regression Line')
				.style('left', d3.event.pageX + 'px')
				.style('top', d3.event.pageY - 28 + 'px');
		})
		.on(`mouseleave`, function() {
			regressionTooltip.transition().duration(500).style('opacity', 0);
		});

	svg
		.append('path')
		.data([ degree5Points ])
		.style('fill', 'none')
		.attr('clip-path', 'url(#clip)')
		.attr('class', 'degree5PolyLine')
		.attr('d', reversedLine);

	svg
		.append('path')
		.data([ degree6Points ])
		.attr('clip-path', 'url(#clip)')
		.style('fill', 'none')
		.attr('class', 'degree6PolyLine')
		.attr('d', reversedLine);

	svg
		.append('path')
		.data([ confUpp ])
		.style('fill', 'none')
		.attr('clip-path', 'url(#clip)')
		.attr('class', 'confidenceBands')
		.attr('d', valueline);
	svg
		.append('path')
		.data([ confLow ])
		.style('fill', 'none')
		.attr('clip-path', 'url(#clip)')
		.attr('class', 'confidenceBands')
		.attr('d', valueline);
	svg
		.append('path')
		.data([ meanCiLow ])
		.style('fill', 'none')
		.attr('clip-path', 'url(#clip)')
		.attr('class', 'confidenceBandsFit')
		.attr('d', valueline);
	svg
		.append('path')
		.data([ meanCiUpp ])
		.style('fill', 'none')
		.attr('clip-path', 'url(#clip)')
		.attr('class', 'confidenceBandsFit')
		.attr('d', valueline);

	// get points to draw linear regression line
	const y1 = xDomainMin * linearRegressionLineSlope + linearRegressionLineYIntercept;
	const y2 = xDomainMax * linearRegressionLineSlope + linearRegressionLineYIntercept;

	svg
		.append('line')
		.attr('class', 'linearRegressionLine')
		.attr('clip-path', 'url(#clip)')
		.attr('x1', x(xDomainMin))
		.attr('y1', y(y1))
		.attr('x2', x(xDomainMax))
		.attr('y2', y(y2));

	// Hidden line with a big hitbox
	svg
		.append('line')
		.attr('class', 'linearRegressionLine-hitbox')
		.attr('clip-path', 'url(#clip)')
		.attr('x1', x(xDomainMin))
		.attr('y1', y(y1))
		.attr('x2', x(xDomainMax))
		.attr('y2', y(y2))
		.on(`mouseenter`, function() {
			regressionTooltip.transition().duration(200).style('opacity', 0.9);
			regressionTooltip
				.html('Linear Regression Line')
				.style('left', d3.event.pageX + 'px')
				.style('top', d3.event.pageY - 28 + 'px');
		})
		.on(`mouseleave`, function() {
			regressionTooltip.transition().duration(500).style('opacity', 0);
		});

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
			d3.select(this).transition().duration(50).attr('r', 5).style('fill', 'red');
			pointTooltip.transition().duration(200).style('opacity', 0.9);
			pointTooltip
				.html(`row: ${d[2]}<br>${colXLabel}: ${d[0]}<br>${colYLabel}: ${d[1]}`)
				.style('left', d3.event.pageX + 'px')
				.style('top', d3.event.pageY - 28 + 'px');
		})
		.on(`mouseleave`, function() {
			d3.select(this).transition().duration(50).attr('r', 2).style('fill', 'black');
			pointTooltip.transition().duration(500).style('opacity', 0);
		});

	const summaryStatsTemplate = `
  <div style="padding: 10px 30px 30px; text-align: center;">
    <h4>Summary Statistics</h4>
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
  </div>`;

	const linearFitTemplate = `<div id="linearRegressionLine" style="padding: 10px 30px; text-align: center;">
    <h4 style="margin-bottom: 0;">Summary of Linear Fit</h4>
    <table style="width: 100%;">
      <tr>
        <td style="width: 25%;">Equation:</td>
        <td style="width: 75%;"> ${colYLabel} = ${linearRegressionLineYIntercept.toFixed(6) / 1} ${addOrSubtract(
		linearRegressionLineSlope.toFixed(6) / 1,
	)} ${Math.abs(linearRegressionLineSlope.toFixed(6) / 1)} * ${colXLabel}</td>
      </tr>
      <tr>
        <td style="width: 25%;">R-squared:</td>
        <td style="width: 75%;">${linearRegressionLineR2}</td>
      </tr>
    </table>
    <h5 style="margin-bottom: 0;">Parameter Estimates</h5>
    <table style="width: 100%;">
      <tr>
        <td style="width: 25%; font-weight: bold;">Term</td>
        <td style="width: 75%; font-weight: bold;">Estimate</td>
      </tr>
      <tr>
        <td style="width: 25%; white-space: nowrap;">Intercept:</td>
        <td style="width: 75%;">${linearRegressionLineYIntercept}</td>
      </tr>
      <tr>
        <td style="width: 25%;">${colXLabel}</td>
        <td style="width: 75%;">${linearRegressionLineSlope.toFixed(6) / 1}</td>
      </tr>
    </table>
  </div>`;

	const quadraticFitTemplate = `<div>
          <div id="degree2PolyLine" style="padding: 10px 30px; text-align: center;">
            <h4 style="margin-bottom: 0;">Summary of Quadratic Fit</h4>
            <table style="width: 100%;">
              <tr>
                <td style="width: 25%;">Equation</td>
                <td style="width: 75%;">${colYLabel} = ${degree2PolyCoefficients[2].toFixed(6) / 1} ${addOrSubtract(
		degree2PolyCoefficients[1],
	)} ${Math.abs(degree2PolyCoefficients[1]).toFixed(6) / 1} * ${colXLabel} ${addOrSubtract(
		degree2PolyCoefficients[0],
	)} ${Math.abs(degree2PolyCoefficients[0]).toFixed(6) / 1} * ${colXLabel}^2</td>
              </tr>
              <tr>
                <td style="width: 25%;">R-squared</td>
                <td style="width: 75%;">${degree2Poly.determination.toFixed(6) / 1}</td>
              </tr>
              </table>
              <h5 style="margin-bottom: 0;">Parameter Estimates</h5>
              <table style="width: 100%;">
              <tr>
                <td style="width: 25%; font-weight: bold;">Term</td>
                <td style="width: 75%; font-weight: bold;">Estimate</td>
              </tr>
              <tr>
                <td style="width: 25%;">Intercept</td>
                <td style="width: 75%;">${degree2PolyCoefficients[2].toFixed(6) / 1}</td>
              </tr>
              <tr>
                <td style="width: 25%;">${colXLabel}</td>
                <td style="width: 75%;">${degree2PolyCoefficients[1].toFixed(6) / 1}</td>
              </tr>
              <tr>
                <td style="width: 25%;">${colXLabel}^2</td>
                <td style="width: 75%;">${degree2PolyCoefficients[0].toFixed(6) / 1}</td>
              </tr>
            </table>
            </div>`;

	const cubicFitTemplate = `<div id="degree3PolyLine" style="padding: 10px 30px; text-align: center;">
            <h4 style="margin-bottom: 0;">Summary of Cubic Fit</h4>
              <table style="width: 100%;">
                <tr>
                  <td style="width: 25%;">Equation</td>
                  <td style="width: 75%;">${colYLabel} = ${degree3PolyCoefficients[3].toFixed(6) / 1} ${addOrSubtract(
		degree3PolyCoefficients[2],
	)} ${Math.abs(degree3PolyCoefficients[2]).toFixed(6) / 1} * ${colXLabel} ${addOrSubtract(
		degree3PolyCoefficients[1],
	)} ${Math.abs(degree3PolyCoefficients[1]).toFixed(6) / 1} * ${colXLabel}^2 ${addOrSubtract(
		degree3PolyCoefficients[0],
	)} ${Math.abs(degree3PolyCoefficients[0]).toFixed(6) / 1} * ${colXLabel}^3</td>
                </tr>
                <tr>
                  <td style="width: 25%;">R-squared</td>
                  <td style="width: 75%;">${degree3Poly.determination.toFixed(6) / 1}</td>
                </tr>
                </table>
                <h5 style="margin-bottom: 0;">Parameter Estimates</h5>
                <table style="width: 100%;">
                <tr>
                  <td style="width: 25%; font-weight: bold;">Term</td>
                  <td style="width: 75%; font-weight: bold;">Estimate</td>
                </tr>
                <tr>
                  <td style="width: 25%;">Intercept</td>
                  <td style="width: 75%;">${degree3PolyCoefficients[3].toFixed(6) / 1}</td>
                </tr>
                <tr>
                  <td style="width: 25%;">${colXLabel}</td>
                  <td style="width: 75%;">${degree3PolyCoefficients[2].toFixed(6) / 1}</td>
                </tr>
                <tr>
                  <td style="width: 25%;">${colXLabel}^2</td>
                  <td style="width: 75%;">${degree3PolyCoefficients[1].toFixed(6) / 1}</td>
                </tr>
                <tr>
                  <td style="width: 25%;">${colXLabel}^3</td>
                  <td style="width: 75%;">${degree3PolyCoefficients[0].toFixed(6) / 1}</td>
                </tr>
              </table>
            </div>
            `;

	const quarticFitTemplate = `<div id="degree4PolyLine" style="padding: 10px 30px; text-align: center;">
            <h4 style="margin-bottom: 0;">Summary of Quartic Fit</h4>
            <table style="width: 100%;">
              <tr>
                <td style="width: 25%;">Equation</td>
                <td style="width: 75%;">${colYLabel} = ${degree4PolyCoefficients[4].toFixed(6) / 1} ${addOrSubtract(
		degree4PolyCoefficients[3],
	)} ${Math.abs(degree4PolyCoefficients[3]).toFixed(6) / 1} * ${colXLabel} ${addOrSubtract(
		degree4PolyCoefficients[2],
	)} ${Math.abs(degree4PolyCoefficients[2]).toFixed(6) / 1} * ${colXLabel}^2 ${addOrSubtract(
		degree4PolyCoefficients[1],
	)} ${Math.abs(degree4PolyCoefficients[1]).toFixed(6) / 1} * ${colXLabel}^3 ${addOrSubtract(
		degree4PolyCoefficients[0],
	)} ${Math.abs(degree4PolyCoefficients[0]).toFixed(6) / 1} * ${colXLabel}^4</td>
              </tr>
              <tr>
                <td style="width: 25%;">R-squared</td>
                <td style="width: 75%;">${degree4Poly.determination.toFixed(6) / 1}</td>
              </tr>
              </table>
              <h5 style="margin-bottom: 0;">Parameter Estimates</h5>
              <table style="width: 100%;">
              <tr>
                <td style="width: 25%; font-weight: bold;">Term</td>
                <td style="width: 75%; font-weight: bold;">Estimate</td>
              </tr>
            <tr>
              <td style="width: 25%;">Intercept</td>
              <td style="width: 75%;">${degree4PolyCoefficients[4].toFixed(6) / 1}</td>
            </tr>
            <tr>
              <td style="width: 25%;">${colXLabel}</td>
              <td style="width: 75%;">${degree4PolyCoefficients[3].toFixed(6) / 1}</td>
            </tr>
            <tr>
              <td style="width: 25%;">${colXLabel}^2</td>
              <td style="width: 75%;">${degree4PolyCoefficients[2].toFixed(6) / 1}</td>
            </tr>
            <tr>
              <td style="width: 25%;">${colXLabel}^3</td>
              <td style="width: 75%;">${degree4PolyCoefficients[1].toFixed(6) / 1}</td>
            </tr>
            <tr>
              <td style="width: 25%;">${colXLabel}^4</td>
              <td style="width: 75%;">${degree4PolyCoefficients[0].toFixed(6) / 1}</td>
            </tr>
          </table>
        </div>
        </div>
          `;

	const summaryStatsParsed = new DOMParser().parseFromString(summaryStatsTemplate, 'text/html');
	const linearFitParsed = new DOMParser().parseFromString(linearFitTemplate, 'text/html');
	const quadraticFitParsed = new DOMParser().parseFromString(quadraticFitTemplate, 'text/html');
	const cubicFitParsed = new DOMParser().parseFromString(cubicFitTemplate, 'text/html');
	const quarticFitParsed = new DOMParser().parseFromString(quarticFitTemplate, 'text/html');

	document.body.insertBefore(summaryStatsParsed.body.firstChild, chartsContainer);
	container.appendChild(linearFitParsed.body.firstChild);
	container.appendChild(quadraticFitParsed.body.firstChild);
	container.appendChild(cubicFitParsed.body.firstChild);
	container.appendChild(quarticFitParsed.body.firstChild);
	window.removeEventListener('message', receiveMessage);

	// hide unchecked chart options
	d3.selectAll('.confidenceBands').attr('display', 'none');
	d3.selectAll('.confidenceBandsFit').attr('display', 'none');
	d3.selectAll('.linearRegressionLine').attr('display', 'none');
	d3.selectAll('.linearRegressionLine-hitbox').attr('display', 'none');
	d3.selectAll('.degree2PolyLine').attr('display', 'none');
	d3.selectAll('.degree2PolyLine-hitbox').attr('display', 'none');
	d3.selectAll('.degree3PolyLine').attr('display', 'none');
	d3.selectAll('.degree3PolyLine-hitbox').attr('display', 'none');
	d3.selectAll('.degree4PolyLine').attr('display', 'none');
	d3.selectAll('.degree4PolyLine-hitbox').attr('display', 'none');
	d3.selectAll('.degree5PolyLine').attr('display', 'none');
	d3.selectAll('.degree5PolyLine-hitbox').attr('display', 'none');
	d3.selectAll('.degree6PolyLine').attr('display', 'none');
	d3.selectAll('.degree6PolyLine-hitbox').attr('display', 'none');
}

window.addEventListener('message', receiveMessage, false);
