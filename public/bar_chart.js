/*global d3 clickedBarPointSize highlightedPointColor highlightedPointSize normalPointSize normalBarFill createPoints reversedLine valueLine drawBasicPath toggleChartElement generateTemplate generateEquationTemplate addOrSubtract unload evaluatePValue toggleCenteredPoly onClickSelectCells chartOptionsTemplate*/
window.addEventListener('unload', unload);
window.opener.postMessage('ready', '*');

// magic linear regression globals
const margin = { top: 40, right: 30, bottom: 30, left: 30 };
const width = 650;
const height = 650;
const svgWidth = width + margin.left + margin.right + 100;
const svgHeight = height + margin.top + margin.bottom;
// const container = document.getElementById('container');

const svg = d3
	.select('.chart')
	.append('svg')
	.attr('width', svgWidth)
	.attr('height', svgHeight)
	.append('g')
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// So that lines stay within the bounds of the graph
svg.append('clipPath').attr('id', 'clip').append('rect').attr('width', width).attr('height', height);
// const x = d3.scaleLinear().range([ 0, width ]);
// const y = d3.scaleLinear().range([ height, 0 ]);

// const xAxis = d3.axisBottom().scale(x).ticks(10, 's');
// const yAxis = d3.axisLeft().scale(y).ticks(10, 's');

function receiveMessage(event) {
	console.log('TARGET', event);
	const { colXLabel, colYLabel, colZLabel, coordinates } = event.data;

	const titleEl = document.createElement('div');
	const titleText = document.createTextNode(`${colYLabel} Vs ${colXLabel}`);
	titleEl.classList.add('analysis-title');
	titleEl.appendChild(titleText);
	const chartsContainer = document.getElementById('chart');
	document.body.insertBefore(titleEl, chartsContainer);

	// const uniqueGroups = [ ...new Set(coordinates.map((row) => row.group)) ];

	const chart = () => {
		svg
			.append('g')
			.selectAll('rect')
			.data(coordinates)
			.join('rect')
			.on(`mouseover`, function(d) {
				d3.select(this).transition().duration(50).attr('opacity', 0.6);
			})
			.on(`mouseout`, function(d) {
				d3.select(this).transition().duration(50).attr('opacity', 1);
			})
			.attr('x', (d) => x0(d.x))
			.attr('y', (d) => y(d.y))
			.transition()
			.duration(50)
			.delay(function(d, i) {
				return i * 100;
			})
			.attr('width', x0.bandwidth())
			.attr('height', (d) => y(0) - y(d.y))
			.attr('fill', (d) => color(d['group']));

		svg.append('g').call(xAxis);

		svg.append('g').call(yAxis);

		svg.append('g').call(legend);

		// text label for the x axis
		svg
			.append('text')
			.attr('transform', 'translate(' + width / 2 + ' ,' + (height + 20) + ')')
			.style('text-anchor', 'middle')
			.text('Time (sec)');

		// text label for the y axis
		svg
			.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', 0 - margin.left)
			.attr('x', 0 - height / 2)
			.attr('dy', '1em')
			.style('text-anchor', 'middle')
			.text('Rate (ml/sec)');

		return svg.node();
	};

	const color = d3.scaleOrdinal().range([ '#98abc5', '#a05d56', '#d0743c', '#ff8c00' ]);

	const legend = (svg) => {
		const g = svg
			.attr('transform', `translate(${width},0)`)
			.attr('text-anchor', 'end')
			.attr('font-family', 'sans-serif')
			.attr('font-size', 18)
			.selectAll('g')
			.data(color.domain().slice().reverse())
			.join('g')
			.attr('transform', (d, i) => `translate(0,${i * 60})`);

		g
			.append('rect')
			.attr('x', 10)
			.attr('width', 40)
			.attr('height', 40)
			.attr('fill', color)
			.on(`mouseover`, function(d) {
				d3.select(this).transition().duration(50).attr('opacity', 0.6);
			})
			.on(`mouseout`, function(d) {
				d3.select(this).transition().duration(50).attr('opacity', 1);
			});

		g.append('text').attr('x', -10).attr('y', 30).text((d) => d);
	};

	const x0 = d3
		.scaleBand()
		.domain(coordinates.sort((a, b) => a.x - b.x).map((d) => d.x))
		.rangeRound([ margin.left, width - margin.right ])
		.paddingInner(0.1);

	// const x1 = d3.scaleBand().domain(keys).rangeRound([ 0, x0.bandwidth() ]).padding(0.1);

	const y = d3
		.scaleLinear()
		.domain([ 0, d3.max(coordinates, (d) => d.y) ])
		.nice()
		.rangeRound([ height - margin.bottom, margin.top ]);

	const xAxis = (g) =>
		g.attr('transform', `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x0).tickSizeOuter(0));

	const yAxis = (g) => g.attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(null, 's'));
	chart();
	window.removeEventListener('message', receiveMessage);
}
window.addEventListener('message', receiveMessage, false);
