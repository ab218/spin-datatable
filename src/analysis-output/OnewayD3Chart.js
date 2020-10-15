import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

// magic globals
const margin = { top: 50, right: 50, bottom: 20, left: 50 };
const width = 300;
const height = 300;
const svgWidth = width + margin.left + margin.right;
const svgHeight = height + margin.top + margin.bottom;
const normalPointSize = 2;
const clickedBarPointSize = normalPointSize * 2;
const highlightedPointColor = 'red';
const highlightedPointSize = normalPointSize * 2.5;

export default function D3Container({ chartOptions, summary_table, colX, colY, x_groups_lists, coordinates }) {
	const { boxPlots, pooledMean } = chartOptions;
	const d3Container = useRef(null);

	const groups = coordinates.map((coord) => coord[0]);
	const lists = Object.values(x_groups_lists).map((x) => Object.values(x));
	const groupValsSorted = lists[1];
	groupValsSorted.forEach((gV) => gV.sort(d3.ascending));
	const x = d3.scaleBand().domain(groups).rangeRound([ 0, width - margin.right ]).paddingInner(1).paddingOuter(0.5);
	const y = d3.scaleLinear().range([ height, 0 ]);
	const xAxis = d3.axisBottom().scale(x).ticks(10, 's').tickSizeOuter(0);
	const yAxis = d3.axisLeft().scale(y).ticks(10, 's');

	const yExtent = d3.extent(coordinates, function(d) {
		return d[1];
	});
	const yRange = yExtent[1] - yExtent[0];
	y.domain([ yExtent[0] - yRange * 0.05, yExtent[1] + yRange * 0.05 ]).nice();

	useEffect(() => {
		if (d3Container.current) {
			const pointTooltip = d3
				.select(d3Container.current)
				.append('div')
				.attr('class', 'point tooltip')
				.style('opacity', 0);
			d3
				.select(d3Container.current)
				.append('div')
				.attr('id', 'meanTooltip')
				.attr('class', 'mean tooltip')
				.style('opacity', 0);
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
				.attr('cx', (d) => x(d[0]))
				.on(`mouseenter`, function(d) {
					onMouseEnterPoint(d, this, pointTooltip);
				})
				.on(`mouseleave`, function(d) {
					onMouseLeavePoint(d, this, pointTooltip);
				});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(
		() => {
			// Boxplot
			const boxPlotStrokeColor = 'purple';
			const boxWidth = 50;
			const svg = d3.select(d3Container.current).select('g');
			if (boxPlots) {
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
						const min = groupValsSorted[i][0];
						return y(min);
					})
					.attr('y2', (d, i) => {
						const max = groupValsSorted[i][groupValsSorted[i].length - 1];
						return y(max);
					})
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
						const q3 = d3.quantile(groupValsSorted[i], 0.75);
						return y(q3);
					})
					.attr('height', (d, i) => {
						const q1 = d3.quantile(groupValsSorted[i], 0.25);
						const q3 = d3.quantile(groupValsSorted[i], 0.75);
						const interquantileRange = y(q1) - y(q3);
						return interquantileRange;
					})
					.attr('width', boxWidth)
					.attr('stroke', boxPlotStrokeColor)
					.style('fill', 'transparent')
					.style('opacity', 0.5)
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
						return y(d3.quantile(groupValsSorted[i], 0.5));
					})
					.attr('y2', function(d, i) {
						return y(d3.quantile(groupValsSorted[i], 0.5));
					})
					.attr('stroke', boxPlotStrokeColor)
					.style('width', 80)
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
						return y(groupValsSorted[i][0]);
					})
					.attr('y2', function(d, i) {
						return y(groupValsSorted[i][0]);
					})
					.attr('stroke', boxPlotStrokeColor)
					.style('width', 80)
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
						return y(groupValsSorted[i][groupValsSorted[i].length - 1]);
					})
					.attr('y2', function(d, i) {
						return y(groupValsSorted[i][groupValsSorted[i].length - 1]);
					})
					.attr('stroke', boxPlotStrokeColor)
					.style('width', 80)
					.attr('class', 'boxPlots');
			} else {
				svg.selectAll('.boxPlots').remove();
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ boxPlots ],
	);

	useEffect(
		() => {
			// pooled mean
			const svg = d3.select(d3Container.current).select('g');
			if (pooledMean) {
				svg
					.append('line')
					.attr('class', 'pooledMean')
					.style('stroke', 'green')
					.attr('stroke-width', 1.5)
					.attr('x1', 0)
					.attr('y1', y(summary_table.y_mean))
					.attr('x2', width - margin.right)
					.attr('y2', y(summary_table.y_mean))
					.on('mouseenter', function(d) {
						onMouseEnterMean(d, d3Container.current);
					})
					.on('mouseleave', function(d) {
						onMouseLeaveMean(d, d3Container.current);
					});
			} else {
				svg.selectAll('.pooledMean').remove();
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ pooledMean ],
	);

	return <div style={{border: "1px solid rgb(192, 192, 192)"}} ref={d3Container} />;

	function onMouseEnterPoint(d, thisPoint, pointTooltip) {
		d3.select(thisPoint).transition().duration(50).attr('r', highlightedPointSize);
		pointTooltip.transition().duration(200).style('opacity', 0.9);
		pointTooltip
			.html(`row: ${d[2]}<br>${colX.label}: ${d[0]}<br>${colY.label}: ${d[1]}`)
			.style('left', d3.event.pageX + 'px')
			.style('top', d3.event.pageY - 28 + 'px');
	}

	function onMouseLeavePoint(d, thisPoint, pointTooltip) {
		if (d3.select(thisPoint).style('fill') === highlightedPointColor) {
			d3.select(thisPoint).transition().duration(50).attr('r', clickedBarPointSize);
		} else {
			d3.select(thisPoint).transition().duration(50).attr('r', normalPointSize);
		}
		pointTooltip.transition().duration(500).style('opacity', 0);
	}

	function onMouseEnterMean(d, container) {
		d3.select(container).select('#meanTooltip').transition().duration(200).style('opacity', 0.9);
		d3
			.select(container)
			.select('#meanTooltip')
			.html(`Pooled Mean: ${summary_table.y_mean}`)
			.style('left', d3.event.pageX + 'px')
			.style('top', d3.event.pageY - 28 + 'px');
	}

	function onMouseLeaveMean(d, container) {
		d3.select(container).select('#meanTooltip').transition().duration(500).style('opacity', 0);
	}
}
