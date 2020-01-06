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
		tempABVals,
		corrcoef,
		covariance,
		colAMean,
		colAStdev,
		colBMean,
		colBStdev,
		pValue,
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

	const colA = tempABVals.map((a) => a[1]).sort(d3.ascending);
	const colB = tempABVals.map((a) => a[0]).sort(d3.ascending);

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
	const xExtent = d3.extent(tempABVals, function(d) {
		return d[0];
	});
	const xRange = xExtent[1] - xExtent[0];
	const yExtent = d3.extent(tempABVals, function(d) {
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
		.thresholds(y.ticks(5)); // then the numbers of bins

	const histogramX = d3
		.histogram()
		.domain(x.domain()) // then the domain of the graphic
		.thresholds(x.ticks(5)); // then the numbers of bins

	// And apply this function to data to get the bins
	const colABins = histogramY(colA);
	const colBBins = histogramX(colB);

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
	var valueline = d3
		.line()
		.x(function(d) {
			return x(d[1]);
		})
		.y(function(d) {
			return y(d[0]);
		});

	svg.append('path').data([ confUpp ]).style('fill', 'none').attr('class', 'confidenceBands').attr('d', valueline);
	svg.append('path').data([ confLow ]).style('fill', 'none').attr('class', 'confidenceBands').attr('d', valueline);
	svg.append('path').data([ meanCiLow ]).style('fill', 'none').attr('class', 'confidenceBandsFit').attr('d', valueline);
	svg.append('path').data([ meanCiUpp ]).style('fill', 'none').attr('class', 'confidenceBandsFit').attr('d', valueline);

	svg
		.append('line')
		.attr('class', 'linearRegressionLine')
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
		.data(tempABVals)
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
                  <td>${tempABVals.length}</td>
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
}

window.addEventListener('message', receiveMessage, false);
