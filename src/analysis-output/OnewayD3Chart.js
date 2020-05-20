import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import './analysis-window.css';
// import { useSpreadsheetState, useSpreadsheetDispatch } from '../SpreadsheetProvider';

// magic globals
const margin = { top: 100, right: 50, bottom: 20, left: 50 };
const width = 400;
const height = 400;
const svgWidth = width + margin.left + margin.right + 100;
const svgHeight = height + margin.top + margin.bottom + 100;
// const normalBarFill = '#69b3a2';
// const clickedBarFill = 'red';
// const normalPointFill = 'black';
const normalPointSize = 2;
// const clickedBarPointSize = normalPointSize * 2;
// const highlightedPointColor = 'red';
// const highlightedPointSize = normalPointSize * 2.5;

export default function D3Container({ summary_table, colX, colY, x_groups_lists, coordinates }) {
	const d3Container = useRef(null);

	const groups = coordinates.map((coord) => coord[0]);
	const lists = Object.values(x_groups_lists).map((x) => Object.values(x));

	// const meanTooltip = d3.select('body').append('div').attr('class', 'mean tooltip').style('opacity', 0);
	// const pointTooltip = d3.select('body').append('div').attr('class', 'point tooltip').style('opacity', 0);
	const x = d3.scaleBand().domain(groups).rangeRound([ 0, width - margin.right ]).paddingInner(1).paddingOuter(0.5);

	const y = d3.scaleLinear().range([ height, 0 ]);
	// define the line
	// const valueLine = d3.line().x((d) => x(d[1])).y((d) => y(d[0]));
	// const reversedLine = d3.line().x((d) => x(d[0])).y((d) => y(d[1]));

	const xAxis = d3.axisBottom().scale(x).ticks(10, 's').tickSizeOuter(0);
	const yAxis = d3.axisLeft().scale(y).ticks(10, 's');
	// const colA = coordinates.map((a) => a[1]).sort(d3.ascending);
	// const colB = coordinates.map((a) => a[0]).sort(d3.ascending);

	// get extents and range
	// const xExtent = d3.extent(coordinates, function(d) {
	// 	return d[0];
	// });
	// const xRange = xExtent[1] - xExtent[0];
	const yExtent = d3.extent(coordinates, function(d) {
		return d[1];
	});
	const yRange = yExtent[1] - yExtent[0];

	// set domain to be extent +- 5%
	// x.domain([ xExtent[0] - xRange * 0.05, xExtent[1] + xRange * 0.05 ]).nice();
	y.domain([ yExtent[0] - yRange * 0.05, yExtent[1] + yRange * 0.05 ]).nice();

	useEffect(() => {
		if (d3Container.current) {
			const svg = d3
				.select(d3Container.current)
				.append('svg')
				.attr('width', svgWidth)
				.attr('height', svgHeight)
				.append('g')
				.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

			// So that lines stay within the bounds of the graph
			svg.append('clipPath').attr('id', 'clip').append('rect').attr('width', width).attr('height', height);
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

			svg
				.selectAll('.point')
				.data(coordinates)
				.enter()
				.append('circle')
				.attr('class', 'point')
				.attr('r', normalPointSize)
				.attr('cy', (d) => y(d[1]))
				.attr('cx', (d) => x(d[0]));
			// .on(`mouseenter`, function(d) {
			// 	onMouseEnterPoint(d, this);
			// })
			// .on(`mouseleave`, function(d) {
			// 	onMouseLeavePoint(d, this);
			// });

			svg
				.append('line') // attach a line
				.style('stroke', 'green') // colour the line
				.attr('stroke-width', 1.5)
				.attr('x1', 0) // x position of the first end of the line
				.attr('y1', y(summary_table.y_mean)) // y position of the first end of the line
				.attr('x2', width - margin.right) // x position of the second end of the line
				.attr('y2', y(summary_table.y_mean))
				// .on('mouseenter', onMouseEnterMean)
				// .on('mouseleave', onMouseLeaveMean)
				// .attr('display', 'none')
				.attr('class', 'pooledMean');

			// Boxplot
			const boxPlotStrokeColor = 'purple';
			const boxWidth = 50;
			// Show the main vertical line
			svg
				.selectAll('minmax')
				.data(lists[0])
				.enter()
				.append('line')
				.attr('stroke', boxPlotStrokeColor)
				.attr('x1', (d) => {
					return x(d);
				})
				.attr('x2', (d) => {
					return x(d);
				})
				.attr('y1', (d, i) => {
					return y(lists[1][i][0]);
				})
				.attr('y2', (d, i) => {
					return y(lists[1][i][lists[1][i].length - 1]);
				})
				// .attr('display', 'none')
				.attr('class', 'boxPlots');

			svg
				.selectAll('boxplotrect')
				.data(lists[0])
				.enter()
				.append('rect')
				.attr('x', (d) => {
					return x(d) - boxWidth / 2;
				})
				.attr('y', (d, i) => {
					return y(d3.quantile(lists[1][i], 0.75));
				})
				.attr('height', (d, i) => {
					return y(d3.quantile(lists[1][i], 0.25)) - y(d3.quantile(lists[1][i], 0.75));
				})
				.attr('width', boxWidth)
				.attr('stroke', boxPlotStrokeColor)
				.style('fill', 'transparent')
				.style('opacity', 0.5)
				// .attr('display', 'none')
				.attr('class', 'boxPlots');

			// show median, min and max horizontal lines
			svg
				.selectAll('medianLines')
				.data(lists[0])
				.enter()
				.append('line')
				.attr('x1', function(d) {
					return x(d) - boxWidth / 2;
				})
				.attr('x2', function(d) {
					return x(d) + boxWidth / 2;
				})
				.attr('y1', function(d, i) {
					return y(d3.quantile(lists[1][i], 0.5));
				})
				.attr('y2', function(d, i) {
					return y(d3.quantile(lists[1][i], 0.5));
				})
				.attr('stroke', boxPlotStrokeColor)
				.style('width', 80)
				// .attr('display', 'none')
				.attr('class', 'boxPlots');

			svg
				.selectAll('minlines')
				.data(lists[0])
				.enter()
				.append('line')
				.attr('x1', function(d) {
					return x(d) - boxWidth / 2;
				})
				.attr('x2', function(d) {
					return x(d) + boxWidth / 2;
				})
				.attr('y1', function(d, i) {
					return y(lists[1][i][0]);
				})
				.attr('y2', function(d, i) {
					return y(lists[1][i][0]);
				})
				.attr('stroke', boxPlotStrokeColor)
				.style('width', 80)
				// .attr('display', 'none')
				.attr('class', 'boxPlots');

			svg
				.selectAll('maxlines')
				.data(lists[0])
				.enter()
				.append('line')
				.attr('x1', function(d) {
					return x(d) - boxWidth / 2;
				})
				.attr('x2', function(d) {
					return x(d) + boxWidth / 2;
				})
				.attr('y1', function(d, i) {
					return y(lists[1][i][lists[1][i].length - 1]);
				})
				.attr('y2', function(d, i) {
					return y(lists[1][i][lists[1][i].length - 1]);
				})
				.attr('stroke', boxPlotStrokeColor)
				.style('width', 80)
				// .attr('display', 'none')
				.attr('class', 'boxPlots');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <div ref={d3Container} />;

	// function onMouseEnterPoint(d, thisPoint) {
	// 	d3.select(thisPoint).transition().duration(50).attr('r', highlightedPointSize);
	// 	pointTooltip.transition().duration(200).style('opacity', 0.9);
	// 	pointTooltip
	// 		.html(`row: ${d[2]}<br>${colX.label}: ${d[0]}<br>${colY.label}: ${d[1]}`)
	// 		.style('left', d3.event.pageX + 'px')
	// 		.style('top', d3.event.pageY - 28 + 'px');
	// }

	// function onMouseLeavePoint(d, thisPoint) {
	// 	if (d3.select(thisPoint).style('fill') === highlightedPointColor) {
	// 		d3.select(thisPoint).transition().duration(50).attr('r', clickedBarPointSize);
	// 	} else {
	// 		d3.select(thisPoint).transition().duration(50).attr('r', normalPointSize);
	// 	}
	// 	pointTooltip.transition().duration(500).style('opacity', 0);
	// }

	// function onMouseEnterMean() {
	// 	// d3.select(thisLine).transition().duration(50).attr('r', highlightedPointSize);
	// 	meanTooltip.transition().duration(200).style('opacity', 0.9);
	// 	meanTooltip
	// 		.html(`Pooled Mean: ${summary_table.y_mean}`)
	// 		.style('left', d3.event.pageX + 'px')
	// 		.style('top', d3.event.pageY - 28 + 'px');
	// }

	// function onMouseLeaveMean() {
	// 	meanTooltip.transition().duration(500).style('opacity', 0);
	// }

	// new SlimSelect({
	// 	select: '#chart-options-dropdown',
	// 	onChange: (info) => {
	// 		console.log(info);
	// 		const boxPlots = info.find((inf) => inf.value === 'boxPlots');
	// 		const pooledMean = info.find((inf) => inf.value === 'pooledMean');
	// 		if (boxPlots) {
	// 			d3.selectAll('.boxPlots').attr('display', 'block');
	// 		} else {
	// 			d3.selectAll('.boxPlots').attr('display', 'none');
	// 		}
	// 		if (pooledMean) {
	// 			d3.selectAll('.pooledMean').attr('display', 'block');
	// 		} else {
	// 			d3.selectAll('.pooledMean').attr('display', 'none');
	// 		}
	// 	},
	// });
}
