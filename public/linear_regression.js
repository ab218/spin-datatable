function evaluatePValue(pValue) {
	if (pValue < 0.0001) {
		return `<td><0.0001</td>`;
	} else if (pValue < 0.001) {
		return `<td>${pValue}</td>`;
	} else if (pValue < 0.01) {
		return `<td>${pValue}</td>`;
	}
	return `<td style=color:green;>${pValue}</td>`;
}

function toggleChartElement(ele) {
	if (ele.checked) {
		d3.selectAll(`.${ele.value}`).attr('display', 'block');
	} else {
		d3.selectAll(`.${ele.value}`).attr('display', 'none');
	}
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
		linearRegressionLinePoints,
		linearRegressionLineEquation,
		linearRegressionLineSlope,
		linearRegressionLineR2,
		linearRegressionLineYIntercept,
	} = event.data;

	const titleEl = document.createElement('div');
	titleEl.style.textAlign = 'center';
	titleEl.style.fontSize = 20;
	const titleText = document.createTextNode(`Fit ${colYLabel} by ${colXLabel}`);
	titleEl.appendChild(titleText);
	const chartsContainer = document.getElementById('chart');
	document.body.insertBefore(titleEl, chartsContainer);
	// set the dimensions and margins of the graph
	const topHistogramOffset = 200;
	const margin = { top: 100, right: 30, bottom: 20, left: 50 };
	const width = 500 - margin.left - margin.right;
	const height = 300 - margin.top - margin.bottom + topHistogramOffset;
	const svgWidth = width + margin.left + margin.right + 100;
	const svgHeight = height + margin.top + margin.bottom + 100;

	const colA = coordinates.map((a) => a[1]).sort(d3.ascending);
	const colB = coordinates.map((a) => a[0]).sort(d3.ascending);

	const svg = d3
		.select('.chart')
		.append('svg')
		.attr('width', svgWidth)
		.attr('height', svgHeight)
		.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	const x = d3.scaleLinear().range([ 0, width ]);
	const y = d3.scaleLinear().range([ height, 0 ]);
	const xAxis = d3.axisBottom().scale(x);
	const yAxis = d3.axisLeft().scale(y);

	// Lower number = higher bars
	const barHeight = 150;
	const barsY = d3.scaleLinear().range([ height, barHeight ]);
	barsY.domain([ 0, colA.length ]);
	const barsX = d3.scaleLinear().range([ 0, width ]);
	barsX.domain([ 0, colB.length ]);

	// get extents and range
	const xExtent = d3.extent(coordinates, function(d) {
		return d[0];
	});
	const xRange = xExtent[1] - xExtent[0];
	const yExtent = d3.extent(coordinates, function(d) {
		return d[1];
	});
	const yRange = yExtent[1] - yExtent[0];

	// set domain to be extent +- 20%
	x.domain([ xExtent[0] - xRange * 0.2, xExtent[1] + xRange * 0.2 ]).nice();
	y.domain([ yExtent[0] - yRange * 0.2, yExtent[1] + yRange * 0.2 ]).nice();

	// set the parameters for the histogram
	const histogramY = d3
		.histogram()
		.domain(y.domain()) // then the domain of the graphic
		.thresholds(y.ticks(6)); // then the numbers of bins

	const histogramX = d3
		.histogram()
		.domain(x.domain()) // then the domain of the graphic
		.thresholds(x.ticks(6)); // then the numbers of bins

	// And apply this function to data to get the bins
	const colABins = histogramY(colA);
	const colBBins = histogramX(colB);

	svg.append('clipPath').attr('id', 'clip').append('rect').attr('width', width).attr('height', height);
	// Histogram Bars
	svg
		.selectAll('xHistBars')
		.data(colABins)
		.enter()
		.append('rect')
		.attr('class', 'histogramBorders')
		.attr('x', 450)
		.attr('y', function(d) {
			// move down 10
			return y(d.x1) + 10;
		})
		.attr('width', function(d) {
			return barsX(d.length);
		})
		.attr('height', function(d) {
			return y(d.x0) - y(d.x1) - 1;
		})
		.attr('fill', '#69b3a2')
		.on(`mouseenter`, function() {
			d3.select(this).transition().duration(50).attr('opacity', 0.6);
		})
		.on(`mouseleave`, function() {
			d3.select(this).transition().duration(50).attr('opacity', 1);
		});

	// Histogram Bars
	svg
		.selectAll('yHistBars')
		.data(colBBins)
		.enter()
		.append('rect')
		.attr('class', 'histogramBorders')
		.attr('y', function(d) {
			return barsY(d.length) - height;
		})
		.attr('x', function(d) {
			return x(d.x0);
		})
		.attr('height', function(d) {
			return height - barsY(d.length);
		})
		.attr('width', function(d) {
			return x(d.x1) - x(d.x0) - 1;
		})
		.attr('fill', '#69b3a2')
		.on(`mouseenter`, function() {
			d3.select(this).transition().duration(50).attr('opacity', 0.6);
		})
		.on(`mouseleave`, function() {
			d3.select(this).transition().duration(50).attr('opacity', 1);
		});

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

	const xDomainMin = x.domain()[0];
	const xDomainMax = x.domain()[1];
	const y1 = xDomainMin * linearRegressionLineSlope + linearRegressionLineYIntercept;
	const y2 = xDomainMax * linearRegressionLineSlope + linearRegressionLineYIntercept;

	// define the line
	const valueline = d3.line().x((d) => x(d[1])).y((d) => y(d[0]));
	const reversedLine = d3.line().x((d) => x(d[0])).y((d) => y(d[1]));

	//generate points y = ax^2+bx+c
	function createPoints(rangeX, step, equation) {
		return Array.from({ length: Math.round((rangeX[1] - rangeX[0]) / step) || 1 }, function(_, i) {
			const x = rangeX[0] + i * step;
			return [ x, equation(x) ];
		});
	}

	const poly2equation = (x) => degree2Poly[0] + degree2Poly[1] * x + degree2Poly[2] * x * x;
	const poly3equation = (x) =>
		degree3Poly[0] + degree3Poly[1] * x + degree3Poly[2] * x * x + degree3Poly[3] * x * x * x;
	const poly4equation = (x) =>
		degree4Poly[0] +
		degree4Poly[1] * x +
		degree4Poly[2] * x * x +
		degree4Poly[3] * x * x * x +
		degree4Poly[4] * x * x * x * x;
	const poly5equation = (x) =>
		degree5Poly[0] +
		degree5Poly[1] * x +
		degree5Poly[2] * x * x +
		degree5Poly[3] * x * x * x +
		degree5Poly[4] * x * x * x * x +
		degree5Poly[5] * x * x * x * x * x;
	const poly6equation = (x) =>
		degree6Poly[0] +
		degree6Poly[1] * x +
		degree6Poly[2] * x * x +
		degree6Poly[3] * x * x * x +
		degree6Poly[4] * x * x * x * x +
		degree6Poly[5] * x * x * x * x * x +
		degree6Poly[6] * x * x * x * x * x * x;

	//points
	const degree2points = createPoints(x.domain(), 1, poly2equation);
	const degree3points = createPoints(x.domain(), 1, poly3equation);
	const degree4points = createPoints(x.domain(), 0.5, poly4equation);
	const degree5points = createPoints(x.domain(), 0.5, poly5equation);
	const degree6points = createPoints(x.domain(), 0.5, poly6equation);

	svg
		.append('path')
		.data([ degree2points ])
		.style('fill', 'none')
		.attr('clip-path', 'url(#clip)')
		.attr('class', 'degree2PolyLine')
		.attr('d', reversedLine);

	svg
		.append('path')
		.data([ degree3points ])
		.style('fill', 'none')
		.attr('clip-path', 'url(#clip)')
		.attr('class', 'degree3PolyLine')
		.attr('d', reversedLine);

	svg
		.append('path')
		.data([ degree4points ])
		.style('fill', 'none')
		.attr('clip-path', 'url(#clip)')
		.attr('class', 'degree4PolyLine')
		.attr('d', reversedLine);

	svg
		.append('path')
		.data([ degree5points ])
		.style('fill', 'none')
		.attr('clip-path', 'url(#clip)')
		.attr('class', 'degree5PolyLine')
		.attr('d', reversedLine);

	svg
		.append('path')
		.data([ degree6points ])
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

	svg
		.append('line')
		.attr('class', 'linearRegressionLine')
		.attr('clip-path', 'url(#clip)')
		.attr('x1', x(xDomainMin))
		.attr('y1', y(y1))
		.attr('x2', x(xDomainMax))
		.attr('y2', y(y2))
		.on(`mouseenter`, function() {
			d3.select(this).transition().duration(50).attr('opacity', 0.6);
		})
		.on(`mouseleave`, function() {
			d3.select(this).transition().duration(50).attr('opacity', 1);
		});

	svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height + ')').call(xAxis.ticks(12, 's'));

	svg.append('g').attr('class', 'y axis').call(yAxis.ticks(12, 's'));

	// const randomJitter = Math.random();

	svg
		.selectAll('.point')
		.data(coordinates)
		.enter()
		.append('circle')
		.attr('class', 'point')
		.attr('r', 2)
		.attr('cy', function(d) {
			return y(d[1]);
		})
		.attr('cx', function(d) {
			return x(d[0]);
		})
		.on(`mouseenter`, function() {
			d3.select(this).transition().duration(50).attr('r', 5).style('fill', 'red');
		})
		.on(`mouseleave`, function() {
			d3.select(this).transition().duration(50).attr('r', 2).style('fill', 'black');
		});

	const template = `<div style="text-align: center; margin: 0 3em;">
            <h4>Summary Statistics</h4>
              <table style="width: 100%;">
                <tr>
                  <td>Pearson's Correlation:</td>
                  <td>${corrcoef}</td>
                </tr>
                <tr>
                  <td>p:</td>
                  ${evaluatePValue(pValue)}
                </tr>
                <tr>
                  <td>Covariance:</td>
                  <td>${covariance}</td>
                </tr>
                <tr>
                  <td>Count:</td>
                  <td>${coordinates.length}</td>
                </tr>
              </table>
              <br>
              <table style="width: 100%;">
                <tr>
                  <td style="font-weight: bold;">Variable</td>
                  <td style="font-weight: bold;">Mean</td>
                  <td style="font-weight: bold;">Std Dev</td>
                </tr>
                <tr>
                  <td>${colXLabel}</td>
                  <td>${colAMean}</td>
                  <td>${colAStdev}</td>
                </tr>
                <tr>
                  <td>${colYLabel}</td>
                  <td>${colBMean}</td>
                  <td>${colBStdev}</td>
                </tr>
              </table>
            <h4>Linear Fit</h4>
            <table style="width: 100%;">
              <tr>
                <td style="width: 50%;">r²:</td>
                <td style="width: 50%;">${linearRegressionLineR2}</td>
              </tr>
              <tr>
                <td style="width: 50%;">slope:</td>
                <td style="width: 50%;">${linearRegressionLineSlope}</td>
              </tr>
              <tr>
                <td style="white-space: nowrap;">y-intercept:</td>
                <td style="width: 50%;">${linearRegressionLineYIntercept}</td>
              </tr>
              <tr>
                <td style="width: 50%;">equation:</td>
                <td style="width: 50%;">${linearRegressionLineEquation}</td>
              </tr>
            </table>
          </div>`;

	const doc = new DOMParser().parseFromString(template, 'text/html');
	container.appendChild(doc.body.firstChild);
	window.removeEventListener('message', receiveMessage);
	d3.selectAll('.histogramBorders').attr('display', 'none');
	d3.selectAll('.confidenceBands').attr('display', 'none');
	d3.selectAll('.confidenceBandsFit').attr('display', 'none');
	d3.selectAll('.degree2PolyLine').attr('display', 'none');
	d3.selectAll('.degree3PolyLine').attr('display', 'none');
	d3.selectAll('.degree4PolyLine').attr('display', 'none');
	d3.selectAll('.degree5PolyLine').attr('display', 'none');
	d3.selectAll('.degree6PolyLine').attr('display', 'none');
}

window.addEventListener('message', receiveMessage, false);
