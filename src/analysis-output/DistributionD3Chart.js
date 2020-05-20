/*global d3 unload onClickSelectCells*/
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import './analysis-window.css';

// set the dimensions and margins of the graph
const margin = { top: 20, right: 30, bottom: 40, left: 70 };
const width = 300 - margin.left - margin.right;
const height = 300 - margin.top - margin.bottom;

function makeSvg(container, id, customWidth) {
	return d3
		.select(container)
		.append('svg')
		.attr('width', (customWidth || width) + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', `translate(${margin.left}, ${margin.top})`);
}

function maxBinLength(arr) {
	let highest = 0;
	for (let i = 0; i < arr.length; i++) {
		if (arr[i].length > highest) {
			highest = arr[i].length;
		}
	}
	return highest;
}

export default function D3Container({ vals, numberOfBins, boxDataSorted, min, max, q1, q3, median }) {
	const d3Container = useRef(null);
	const center = 1;
	const boxWidth = 40;

	// Add axes
	const x = d3.scaleLinear().range([ 0, width ]);
	const y = d3.scaleLinear().domain([ min, max ]).range([ height, 0 ]).nice();

	useEffect(() => {
		if (vals && d3Container.current) {
			// append the histogram svg object to the body of the page
			const histSvg = makeSvg(d3Container.current, 'histogramVis');
			const boxSvg = makeSvg(d3Container.current, 'boxplotVis', 100);

			histSvg.append('g').attr('class', 'x axis').call(d3.axisLeft().scale(y).ticks(10, 's'));
			// set the parameters for the histogram
			const histogram = d3
				.histogram()
				.domain(y.domain()) // then the domain of the graphic
				.thresholds(y.ticks(numberOfBins)); // then the numbers of bins

			// And apply this function to data to get the bins
			const bins = histogram(boxDataSorted);
			x.domain([ 0, maxBinLength(bins) ]);

			histSvg
				.append('g')
				.attr('class', 'x axis')
				.attr('transform', 'translate(0,' + height + ')')
				.call(d3.axisBottom().scale(x).ticks(5, 's'));

			// Histogram Bars
			histSvg
				.selectAll('histBars')
				.data(bins)
				.enter()
				.append('rect')
				.attr('fill', '#69b3a2')
				.on(`mouseenter`, function() {
					d3.select(this).transition().duration(50).attr('opacity', 0.6);
				})
				.on(`mouseleave`, function() {
					d3.select(this).transition().duration(50).attr('opacity', 1);
				})
				.on('click', function(d) {
					onClickSelectCells(d3.select(this), d, 'y');
				})
				.attr('x', 1)
				.attr('y', (d) => y(d.x1))
				// The -1 adds a little bit of padding between bars
				.attr('height', (d) => y(d.x0) - y(d.x1) - 1)
				.transition()
				.duration(500)
				.delay((_, i) => i * 100)
				.attr('width', (d) => x(d.length));

			// Boxplot
			// Show the main vertical line
			boxSvg
				.append('line')
				.attr('x1', center)
				.attr('x2', center)
				.attr('y1', y(min))
				.attr('y2', y(max))
				.attr('stroke', 'black');
			boxSvg
				.append('line')
				.attr('x1', center)
				.attr('x2', center)
				.attr('y1', y(min))
				.attr('y2', y(max))
				.attr('stroke', 'black');
			boxSvg
				.append('rect')
				.attr('x', center - boxWidth / 2)
				.attr('y', y(q3))
				.attr('height', y(q1) - y(q3))
				.attr('width', boxWidth)
				.attr('stroke', 'black')
				.style('fill', '#69b3a2');
			// show median, min and max horizontal lines
			boxSvg
				.selectAll('toto')
				.data([ min, median, max ])
				.enter()
				.append('line')
				.attr('x1', center - boxWidth / 2)
				.attr('x2', center + boxWidth / 2)
				.attr('y1', (d) => y(d))
				.attr('y2', (d) => y(d))
				.attr('stroke', 'black');

			const jitterWidth = 10;
			const jitter = jitterWidth / 2 + Math.random() * jitterWidth;

			boxSvg
				.selectAll('indPoints')
				.data(boxDataSorted)
				.enter()
				.append('circle')
				.attr('cx', () => center - boxWidth / 10)
				.attr('cy', (d) => y(d) - jitter)
				.attr('r', 4)
				.style('fill', 'white')
				.attr('stroke', 'black');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <div ref={d3Container} />;
}
