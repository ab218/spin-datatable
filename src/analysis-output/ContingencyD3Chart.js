import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

// magic globals
const margin = { top: 20, right: 50, bottom: 50, left: 30 };
const width = 500;
const height = 500;
const svgWidth = width + margin.left + margin.right;
const svgHeight = height + margin.top + margin.bottom;

const wrap = function() {
	const self = d3.select(this);
	let textLength = self.node().getComputedTextLength();
	let text = self.text();
	while (textLength > 50 && text.length > 0) {
		text = text.slice(0, -1);
		self.text(text + '...');
		textLength = self.node().getComputedTextLength();
	}
};

export default function D3Container({ colX, colY, groups, data, totals, n }) {
	const d3Container = useRef(null);
	const groupKeys = totals.flatMap((key) => Object.keys(key));
	const x = d3.scaleBand().domain(groups).rangeRound([ 0, width - margin.right ]).paddingInner(1).paddingOuter(0.5);
	const y = d3.scaleLinear().domain([ 0, 1 ]).range([ height - margin.top - margin.bottom, 0 ]);
	const newY = d3.scaleLinear().domain([ 0, 100 ]).range([ 0, 500 ]);
	const yAxis = d3.axisLeft().scale(y).ticks(4, 's');
	const xAxis = d3.axisBottom().scale(x).ticks(10, 's').tickSizeOuter(0);
	const color = d3
		.scaleOrdinal([ '#56B4E9', '#E69F00', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7', '#999999' ])
		.domain(data.map((d) => d.y));
	const treemap = (data) =>
		d3
			.treemap()
			.round(true)
			.tile(d3.treemapSliceDice)
			.size([ width - margin.left - margin.right, height - margin.top - margin.bottom ])(
			d3
				.hierarchy(
					{
						values: d3.nest().key((d) => d.x).key((d) => d.y).entries(data),
					},
					(d) => d.values,
				)
				.sum((d) => d.value),
		).each((d) => {
			d.x0 += margin.left;
			d.x1 += margin.left;
			d.y0 += margin.top;
			d.y1 += margin.top;
		});

	useEffect(
		() => {
			if (d3Container.current) {
				const tileTooltip = d3
					.select(d3Container.current)
					.append('div')
					.attr('class', 'contingency-tooltip')
					.style('opacity', 0);

				const root = treemap(data);

				const svg = d3
					.select(d3Container.current)
					.append('svg')
					.attr('width', svgWidth)
					.attr('height', svgHeight)
					.append('g')
					.attr('transform', `translate(${margin.left},${margin.top})`);

				const node = svg
					.selectAll('g')
					.data(root.descendants())
					.join('g')
					.attr('transform', (d) => `translate(${d.x0},${d.y0})`);

				// text label for the x axis
				svg
					.append('text')
					.attr('transform', `translate(${width / 2},${height + margin.top})`)
					.style('text-anchor', 'middle')
					.style('font-size', '18px')
					.text(colX.label);

				// text label for the y axis
				svg
					.append('text')
					.attr('transform', 'rotate(-90)')
					.attr('y', 0 - margin.left)
					.attr('x', 0 - height / 2)
					.attr('dy', '1em')
					.style('font-size', '18px')
					.style('text-anchor', 'middle')
					.text(colY.label);

				svg
					.append('g')
					.attr('class', 'x axis')
					.attr('transform', `translate(0,${height - margin.bottom})`)
					.style('font-size', '12px')
					.call(xAxis)
					.selectAll('text')
					.style('text-anchor', 'end')
					.attr('dx', '-.8em')
					.attr('dy', '.15em')
					.attr('transform', 'rotate(-65)')
					.each(wrap);

				// remove x axis line
				svg.select('.domain').remove();
				svg
					.append('g')
					.style('font-size', '12px')
					.attr('class', 'y axis')
					.call(yAxis)
					.attr('transform', `translate(${margin.left},${margin.top})`);
				// svg
				// 	.append('g')
				// 	.style('font-size', '12px')
				// 	.attr('class', 'y axis')
				// 	.call(rightYAxis)
				// 	.attr('transform', 'translate(' + width + ',' + margin.top + ')');

				// column headers
				// const column = node.filter((d) => d.depth === 1);
				// column.append('text').attr('x', 3).attr('y', '-1.7em').style('font-weight', 'bold').text((d) => d.data.key);
				// column.append('text').attr('x', 3).attr('y', '-0.5em').attr('fill-opacity', 0.7).text((d) => format(d.value));

				const cell = node.filter((d) => d.depth === 2);

				const flatTotals = totals.reduce((acc, curr) => {
					return { ...acc, ...curr };
				}, []);
				const stackedData = d3.stack().keys(groupKeys)([ flatTotals ]);

				// totals column
				const stacked = svg.append('g').selectAll('g').data(stackedData).enter();

				const stackedGroups = stacked
					.append('g')
					.attr('fill', (d) => color(d.key))
					.selectAll('rect')
					// enter a second time = loop subgroup per subgroup to add all rectangles
					.data((d) => {
						// trick to bring the key to the next loop
						const newArr = [];
						d[0].key = d.key;
						newArr.push(d[0]);
						return newArr;
					})
					.enter();

				const groupPadding = 2;
				stackedGroups
					.append('rect')
					.attr('x', width + 20)
					.attr('y', (d) => {
						return (height - margin.top - margin.bottom) * newY(d[0]) / 100;
					})
					.attr('height', (d) => {
						return (height - margin.top - margin.bottom) * (newY(d[1]) - newY(d[0])) / 100 - groupPadding;
					})
					.attr('width', 10)
					.on(`mouseover`, function(d) {
						onMouseEnterTile(tileTooltip);
					})
					.on('mousemove', function(d) {
						const groupHtml = `
              <div>
                <div><span class="tooltip-margin-left-bold">${d.key}</span><span></span></div>
                <div><span class="tooltip-margin-left-bold">Proportion: </span>
                <span>${((d[1] - d[0]) / n * 100).toFixed()}%</span></div>
              </div>
              `;
						onMouseMoveTile(tileTooltip, groupHtml);
					})
					.on(`mouseleave`, function(d) {
						onMouseLeaveTile(tileTooltip);
					})
					.attr('transform', `translate(0,${margin.top})`);

				stacked
					.append('text')
					.text((d) => d.key)
					.attr('y', (d) => {
						return (height - margin.bottom - margin.top) * ((newY(d[0][1]) + newY(d[0][0])) / 2) / 100;
					})
					.attr('x', width + 15)
					.attr('text-anchor', 'end')
					.style('fill', 'black')
					.attr('transform', `translate(0,${margin.top})`)
					.each(wrap);

				const tilePadding = 3;
				// mosaic tiles
				cell
					.append('rect')
					.attr('fill', (d) => color(d.data.key))
					.attr('width', (d) => d.x1 - d.x0 - tilePadding)
					.attr('height', (d) => d.y1 - d.y0 - tilePadding)
					.on(`mouseover`, function(d) {
						onMouseEnterTile(tileTooltip);
					})
					.on('mousemove', function(d) {
						const { value, x, y } = d.data.values[0];
						const tileHtml = `
            <div>
              <div class="tooltip-margin-left-bold">${value} row${value === 1 ? '' : 's'}</div>
              <div><span class="tooltip-margin-left-bold">${colX.label}:</span><span> ${x}</span></div>
              <div><span class="tooltip-margin-left-bold">${colY.label}:</span><span> ${y}</span></div>
            </div>
            `;
						onMouseMoveTile(tileTooltip, tileHtml);
					})
					.on(`mouseleave`, function(d) {
						onMouseLeaveTile(tileTooltip);
					});

				// cell
				// 	.append('text')
				// 	.attr('x', 3)
				// 	.attr('fill', 'white')
				// 	.attr('y', '1.1em')
				// 	.text((d) => (d.value > 0 ? d.data.key : ''));

				// cell
				// 	.append('text')
				// 	.attr('x', 3)
				// 	.attr('y', '2.3em')
				// 	// .attr('fill-opacity', 0.7)
				// 	.attr('fill', 'white')
				// 	.text((d) => format(d.value > 0 ? d.value : ''));
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	let timeout;

	function onMouseMoveTile(tileTooltip, html) {
		tileTooltip.html(html).style('left', d3.event.pageX + 10 + 'px').style('top', d3.event.pageY - 28 + 'px');
	}

	function onMouseEnterTile(tileTooltip) {
		timeout = setTimeout(() => {
			return tileTooltip.transition().duration(300).style('opacity', 0.9);
		}, 500);
	}

	function onMouseLeaveTile(tileTooltip) {
		clearTimeout(timeout);
		tileTooltip.transition().duration(100).style('opacity', 0);
	}

	return <div ref={d3Container} />;
}
