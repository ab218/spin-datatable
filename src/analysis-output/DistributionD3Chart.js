import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useSelectDispatch, useRowsState } from '../context/SpreadsheetProvider';
import { REMOVE_SELECTED_CELLS, SELECT_CELLS_BY_IDS } from '../constants';

// set the dimensions and margins of the graph
const margin = { top: 20, right: 30, bottom: 40, left: 70 };
const width = 300 - margin.left - margin.right;
const height = 300 - margin.top - margin.bottom;
const center = 1;
const boxWidth = 40;
const normalBarFill = '#69b3a2';
const clickedBarFill = 'red';
const normalPointFill = 'black';
const normalPointSize = 2;
const clickedBarPointSize = normalPointSize * 2;

function makeSvg(container, customWidth) {
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

export default function D3Container({ colObj, vals, numberOfBins, boxDataSorted, min, max, q1, q3, median }) {
	const d3Container = useRef(null);

	const { columns, rows, excludedRows } = useRowsState();
	const dispatchSelectAction = useSelectDispatch();

	function targetClickEvent(thisBar, values, col) {
		d3.selectAll('.point').style('fill', normalPointFill).attr('r', normalPointSize);
		d3.select(d3Container.current).selectAll('.histBars').style('fill', normalBarFill);

		thisBar.style('fill', clickedBarFill);
		d3
			.selectAll('.point')
			.filter((d) => {
				const binMin = values.x0;
				const binMax = values.x1;
				if (!d) {
					return null;
				}
				if (col === 'x') {
					return d[0] >= binMin && d[0] < binMax;
				}
				return d[1] >= binMin && d[1] < binMax;
			})
			.attr('r', clickedBarPointSize)
			.style('fill', clickedBarFill);
		dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });

		const rowIDs = rows.reduce((acc, row) => {
			// TODO:Don't use Number. Won't work for strings.
			return !excludedRows.includes(row.id) && values.includes(Number(row[colObj.id])) ? acc.concat(row.id) : acc;
		}, []);
		dispatchSelectAction({ type: SELECT_CELLS_BY_IDS, rowIDs, columnID: colObj.id, rows, columns });
	}

	// Add axes
	const x = d3.scaleLinear().range([ 0, width ]);
	const y = d3.scaleLinear().domain([ min, max ]).range([ height, 0 ]).nice();

	useEffect(
		() => {
			if (vals && d3Container.current) {
				// append the histogram svg object to the body of the page
				const histSvg = makeSvg(d3Container.current);
				const boxSvg = makeSvg(d3Container.current, 100);

				histSvg.append('g').attr('class', 'yAxis').call(d3.axisLeft().scale(y).ticks(numberOfBins, 's'));

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
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	useEffect(
		() => {
			// set the parameters for the histogram
			const histogram = d3
				.histogram()
				.domain(y.domain()) // then the domain of the graphic
				.thresholds(y.ticks(numberOfBins)); // then the numbers of bins

			const histSvg = d3.select(d3Container.current).select('g');

			// And apply this function to data to get the bins
			const bins = histogram(boxDataSorted);
			x.domain([ 0, maxBinLength(bins) ]);

			histSvg
				.append('g')
				.attr('class', 'xAxis')
				.attr('transform', 'translate(0,' + height + ')')
				.call(d3.axisBottom().scale(x).ticks(5, 's'));

			// Histogram Bars
			histSvg
				.selectAll('histBars')
				.data(bins)
				.enter()
				.append('rect')
				.attr('fill', '#69b3a2')
				.attr('class', 'histBars')
				.on(`mouseenter`, function() {
					d3.select(this).transition().duration(50).attr('opacity', 0.6);
				})
				.on(`mouseleave`, function() {
					d3.select(this).transition().duration(50).attr('opacity', 1);
				})
				.on('click', function(d) {
					targetClickEvent(d3.select(this), d, 'y');
				})
				.attr('x', 1)
				.attr('y', (d) => y(d.x1))
				// The -1 adds a little bit of padding between bars
				.attr('height', (d) => y(d.x0) - y(d.x1) - 1)
				.transition()
				.duration(500)
				.delay((_, i) => i * 100)
				.attr('width', (d) => x(d.length));

			return () => {
				histSvg.selectAll('.histBars').remove();
				histSvg.selectAll('.xAxis').remove();
			};
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ numberOfBins ],
	);

	return <div ref={d3Container} />;
}
