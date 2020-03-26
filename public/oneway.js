/*global d3 clickedBarPointSize highlightedPointColor highlightedPointSize normalPointSize normalBarFill createPoints reversedLine valueLine drawBasicPath toggleChartElement generateTemplate generateEquationTemplate addOrSubtract unload evaluatePValue toggleCenteredPoly onClickSelectCells chartOptionsTemplate*/
window.addEventListener('unload', unload);
window.opener.postMessage('ready', '*');

// magic globals
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
	const { anova, colY, colX, coordinates } = event.data;

	console.log(anova);

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

	const xDomainMin = x.domain()[0];
	const xDomainMax = x.domain()[1];

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
}
window.addEventListener('message', receiveMessage, false);
