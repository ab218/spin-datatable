/*global d3 clickedBarPointSize highlightedPointColor highlightedPointSize normalPointSize normalBarFill createPoints reversedLine valueLine drawBasicPath toggleChartElement generateTemplate generateEquationTemplate addOrSubtract unload evaluatePValue toggleCenteredPoly onClickSelectCells chartOptionsTemplate*/
const yData = [
	11.66,
	5.42,
	7.35,
	10,
	4.55,
	5.12,
	4.82,
	3.59,
	13.53,
	14.52,
	0.268,
	0.262,
	0.227,
	0.203,
	0.187,
	0.187,
	0.213,
	0.18,
	0.153,
	0.158,
];

const xData = [
	3,
	5.9,
	4.9,
	4,
	9,
	7.8,
	8.5,
	6.5,
	3.4,
	3.1,
	14.9,
	26.7,
	22.1,
	29.6,
	26.8,
	32.1,
	32.9,
	33.4,
	32.7,
	31.6,
];

const groupData = [
	'Liver',
	'Liver',
	'Liver',
	'Liver',
	'Liver',
	'Liver',
	'Liver',
	'Liver',
	'Liver',
	'Liver',
	'Potato',
	'Potato',
	'Potato',
	'Potato',
	'Potato',
	'Potato',
	'Potato',
	'Potato',
	'Potato',
	'Potato',
];

let linear = true;

document.addEventListener('DOMContentLoaded', function() {
	document.getElementById('x-axis-scale').addEventListener('click', (e) => {
		if (e.target.checked) {
			linear = false;
			d3.select('svg').remove();
			chart();
		} else {
			linear = true;
			d3.select('svg').remove();
			chart();
		}
	});
});

// magic linear regression globals
const margin = { top: 40, right: 30, bottom: 30, left: 30 };
const width = 650;
const height = 650;
const svgWidth = width + margin.left + margin.right + 100;
const svgHeight = height + margin.top + margin.bottom;

const titleEl = document.createElement('div');
const titleText = document.createTextNode(`Rate (ml/sec) vs. Time (sec)`);
titleEl.classList.add('analysis-title');
titleEl.appendChild(titleText);
const chartsContainer = document.getElementById('chart');
document.body.insertBefore(titleEl, chartsContainer);

const makeData = (x, y, group) => {
	const data = [];
	for (let i = 0; i < x.length; i++) {
		data.push({
			x: x[i],
			y: y[i],
			group: group[i],
			row: i + 1,
		});
	}
	return data;
};

const potatoData = makeData(xData, yData, groupData);

const barTooltip = d3.select('body').append('div').attr('class', 'bar tooltip').style('opacity', 0);

function onMouseOverBars(d, thisBar) {
	d3.select(thisBar).transition().duration(50).style('opacity', 0.6);
	barTooltip.transition().duration(200).style('opacity', 0.9);
	barTooltip
		.html(`Group: ${d.group}<br>Rate (ml/sec): ${d.y}<br>Time (sec): ${d.x}<br>row: ${d.row}`)
		.style('left', `${d3.event.pageX}px`)
		.style('top', `${d3.event.pageY - 28}px`);
}

function onMouseOutBars(_, thisBar) {
	d3.select(thisBar).transition().duration(50).style('opacity', 1);
	barTooltip.transition().duration(500).style('opacity', 0);
}

const chart = () => {
	const svg = d3
		.select('.chart')
		.append('svg')
		.attr('width', svgWidth)
		.attr('height', svgHeight)
		.append('g')
		.attr('transform', `translate(${margin.left},${margin.top})`);

	const x = linear
		? d3
				.scaleLinear()
				.range([ 0 + margin.left, width - margin.right ])
				.domain([ Math.min(...xData), Math.max(...xData) ])
				.nice()
		: d3
				.scaleBand()
				.domain(potatoData.sort((a, b) => a.x - b.x).map((d) => d.x))
				.rangeRound([ margin.left, width - margin.right ])
				.paddingInner(0.1);

	const xAxis = (g) =>
		linear
			? g
					.attr('class', 'x-axis')
					.attr('transform', `translate(0,${height - margin.bottom})`)
					.call(d3.axisBottom(x).ticks(20, 's'))
			: g
					.attr('class', 'x-axis')
					.attr('transform', `translate(0,${height - margin.bottom})`)
					.call(d3.axisBottom(x).tickSize(0))
					.selectAll('text')
					.style('text-anchor', 'end')
					.attr('dx', '-.8em')
					.attr('dy', '.15em')
					.attr('transform', 'rotate(-65)');

	svg
		.append('g')
		.selectAll('rect')
		.data(potatoData)
		.join('rect')
		.on(`mouseover`, function(d) {
			onMouseOverBars(d, this);
		})
		.on(`mouseout`, function(d) {
			onMouseOutBars(d, this);
		})
		.attr('x', (d) => x(d.x))
		.attr('y', (d) => y(d.y))
		.transition()
		.duration(100)
		.delay(function(d, i) {
			return i * 50;
		})
		.attr('width', linear ? 3 : x.bandwidth())
		.attr('height', (d) => y(0) - y(d.y))
		.attr('fill', (d) => color(d['group']));

	svg.append('g').call(xAxis);

	svg.append('g').call(yAxis);

	svg.append('g').call(legend);

	// text label for the x axis
	svg
		.append('text')
		.attr('transform', `translate(${width / 2},${height + 20})`)
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

	svg
		.append('text')
		.attr('text-anchor', 'middle')
		.attr('text-decoration', 'underline')
		.attr('transform', `translate(${width},50)`)
		.attr('font-size', 18)
		.text('Catalase Solution');

	return svg.node();
};

const color = d3.scaleOrdinal().range([ '#F78888', '#F3D250', '#ECECEC', '#90CCF4', '#5DA2D5' ]);

const legend = (svg) => {
	const g = svg
		.attr('transform', `translate(${width},80)`)
		.attr('text-anchor', 'end')
		.attr('font-family', 'sans-serif')
		.attr('font-size', 16)
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

const y = d3
	.scaleLinear()
	.domain([ 0, d3.max(potatoData, (d) => d.y) ])
	.nice()
	.rangeRound([ height - margin.bottom, margin.top ]);

const yAxis = (g) => g.attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(null, 's'));
chart();
