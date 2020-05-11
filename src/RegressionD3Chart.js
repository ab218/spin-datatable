import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import './analysis-window.css';

const normalPointSize = 2;
const highlightedPointColor = 'red';
const highlightedPointSize = normalPointSize * 2.5;
const clickedBarPointSize = normalPointSize * 2;
const normalBarFill = '#69b3a2';
const clickedBarFill = 'red';
const normalPointFill = 'black';
const margin = { top: 100, right: 50, bottom: 20, left: 50 };
const width = 400;
const height = 400;
const svgWidth = width + margin.left + margin.right + 100;
const svgHeight = height + margin.top + margin.bottom + 100;
const x = d3.scaleLinear().range([ 0, width ]);
const y = d3.scaleLinear().range([ height, 0 ]);
// define the line
const xAxis = d3.axisBottom().scale(x).ticks(10, 's');
const yAxis = d3.axisLeft().scale(y).ticks(10, 's');
const reversedLine = d3.line().x((d) => x(d[0])).y((d) => y(d[1]));

//generate n (step) points given some range and equation (ie: y = ax^2+bx+c)
function createPoints(rangeX, step, equation) {
	return Array.from({ length: Math.round((rangeX[1] - rangeX[0]) / step) || 1 }, function(_, i) {
		const x = rangeX[0] + i * step;
		return [ x, equation(x) ];
	});
}

const drawBasicPath = (points, name, title, svg, pathTooltip) => {
	const path = svg
		.append('path')
		.data([ points ])
		.style('fill', 'none')
		.attr('clip-path', 'url(#clip)')
		.attr('class', name)
		.attr('d', reversedLine);
	//find total length of all points of the line chart line
	const totalLength = path.node().getTotalLength();

	//animate the line chart line drawing using path information
	path
		.attr('stroke-dasharray', totalLength + ' ' + totalLength)
		.attr('stroke-dashoffset', totalLength)
		.transition()
		.duration(500)
		.ease(d3.easeLinear)
		.attr('stroke-dashoffset', 0);

	// invisible hitbox
	svg
		.append('path')
		.data([ points ])
		.style('fill', 'none')
		.attr('clip-path', 'url(#clip)')
		.attr('class', `${name}-hitbox`)
		.attr('d', reversedLine)
		.on(`mouseenter`, function() {
			pathTooltip.transition().duration(200).style('opacity', 0.9);
			pathTooltip.html(title).style('left', d3.event.pageX + 'px').style('top', d3.event.pageY - 28 + 'px');
		})
		.on(`mouseleave`, function() {
			pathTooltip.transition().duration(500).style('opacity', 0);
		});
};

function drawHistogramBorders(svg, colA, colB, histogramBinTooltip) {
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

	function onClickSelectCells(thisBar, bar, col) {
		// let metaKeyPressed = false;
		if (d3.event.metaKey) {
			// metaKeyPressed = true;
		} else {
			d3.selectAll('.point').style('fill', normalPointFill).attr('r', normalPointSize);
			d3.selectAll('rect').style('fill', normalBarFill);
		}
		thisBar.style('fill', clickedBarFill);
		d3
			.selectAll('.point')
			.filter((d) => {
				const binMin = bar.x0;
				const binMax = bar.x1;
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
	}
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

function mapPoints(arr1, arr2) {
	const output = [];
	for (let i = 0; i < arr1.length; i++) {
		output.push([ arr1[i], arr2[i] ]);
	}
	return output;
}

function onMouseEnterPoint(d, thisPoint, colXLabel, colYLabel, pointTooltip) {
	d3.select(thisPoint).transition().duration(50).attr('r', highlightedPointSize);
	pointTooltip.transition().duration(200).style('opacity', 0.9);
	pointTooltip
		.html(`row: ${d[2]}<br>${colXLabel}: ${d[0]}<br>${colYLabel}: ${d[1]}`)
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

export default function D3Container({ data, chartOptions, CI }) {
	const d3Container = useRef(null);
	const { reg1, reg2, reg3, reg4, reg5, reg6, colY, colX, coordinates } = data;

	const {
		histogramBorders,
		linearRegressionLine,
		degree2Poly,
		degree3Poly,
		degree4Poly,
		degree5Poly,
		degree6Poly,
	} = chartOptions;

	const linearRegressionCoefficients = reg1.stats['polynomial'];
	const degree2PolyCoefficients = reg2.stats['polynomial'];
	const degree3PolyCoefficients = reg3.stats['polynomial'];
	const degree4PolyCoefficients = reg4.stats['polynomial'];
	const degree5PolyCoefficients = reg5.stats['polynomial'];
	const degree6PolyCoefficients = reg6.stats['polynomial'];
	const linearRegressionEquation = (x) => linearRegressionCoefficients[0] + linearRegressionCoefficients[1] * x;
	const xDomainMin = x.domain()[0];
	const xDomainMax = x.domain()[1];
	const step = (xDomainMax - xDomainMin) / 200;
	const linearRegressionPoints = createPoints(x.domain(), step, linearRegressionEquation);
	const poly2equation = (x) =>
		degree2PolyCoefficients[0] + degree2PolyCoefficients[1] * x + degree2PolyCoefficients[2] * x * x;
	const poly3equation = (x) =>
		degree3PolyCoefficients[0] +
		degree3PolyCoefficients[1] * x +
		degree3PolyCoefficients[2] * x * x +
		degree3PolyCoefficients[3] * x * x * x;
	const poly4equation = (x) =>
		degree4PolyCoefficients[0] +
		degree4PolyCoefficients[1] * x +
		degree4PolyCoefficients[2] * x * x +
		degree4PolyCoefficients[3] * x * x * x +
		degree4PolyCoefficients[4] * x * x * x * x;
	const poly5equation = (x) =>
		degree5PolyCoefficients[0] +
		degree5PolyCoefficients[1] * x +
		degree5PolyCoefficients[2] * x * x +
		degree5PolyCoefficients[3] * x * x * x +
		degree5PolyCoefficients[4] * x * x * x * x +
		degree5PolyCoefficients[5] * x * x * x * x * x;
	const poly6equation = (x) =>
		degree6PolyCoefficients[0] +
		degree6PolyCoefficients[1] * x +
		degree6PolyCoefficients[2] * x * x +
		degree6PolyCoefficients[3] * x * x * x +
		degree6PolyCoefficients[4] * x * x * x * x +
		degree6PolyCoefficients[5] * x * x * x * x * x +
		degree6PolyCoefficients[6] * x * x * x * x * x * x;

	//points
	const degree2Points = createPoints(x.domain(), step, poly2equation);
	const degree3Points = createPoints(x.domain(), step, poly3equation);
	const degree4Points = createPoints(x.domain(), step, poly4equation);
	const degree5Points = createPoints(x.domain(), step, poly5equation);
	const degree6Points = createPoints(x.domain(), step, poly6equation);
	// Column Points
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

	const pointTooltip = d3.select(d3Container.current).append('div').attr('class', 'point tooltip').style('opacity', 0);
	const pathTooltip = d3
		.select(d3Container.current)
		.append('div')
		.attr('class', 'regression-line tooltip')
		.style('opacity', 0);
	const histogramBinTooltip = d3
		.select(d3Container.current)
		.append('div')
		.attr('class', 'histogram-border tooltip')
		.style('opacity', 0);

	// initialize chart with static features (axes and points)
	useEffect(
		() => {
			if (data && d3Container.current) {
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
						onMouseEnterPoint(d, this, colX.label, colY.label, pointTooltip);
					})
					.on(`mouseleave`, function(d) {
						onMouseLeavePoint(d, this, pointTooltip);
					});
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ data ],
	);

	// chart options
	useEffect(
		() => {
			if (d3Container.current && data && chartOptions) {
				const svg = d3.select(d3Container.current).select('g');
				const removeChartElement = (className) => d3.select(d3Container.current).selectAll(className).remove();
				if (histogramBorders) {
					drawHistogramBorders(svg, colA, colB, histogramBinTooltip);
				} else {
					removeChartElement(`.histogramBorders`);
				}
				if (linearRegressionLine) {
					drawBasicPath(linearRegressionPoints, 'linearRegressionLine', 'Linear Regression Line', svg, pathTooltip);
					if (CI && CI.linearRegressionLineCIFitLower && CI.linearRegressionLineCIFitLower.length > 0) {
						drawBasicPath(
							mapPoints(colB, CI.linearRegressionLineCIFitUpper.sort((a, b) => b - a)),
							'linearRegressionLineCIFit',
							'Linear Regression CI',
							svg,
							pathTooltip,
						);
						drawBasicPath(
							mapPoints(colB, CI.linearRegressionLineCIFitLower.sort((a, b) => b - a)),
							'linearRegressionLineCIFit',
							'Linear Regression CI',
							svg,
							pathTooltip,
						);
					} else {
						removeChartElement('.linearRegressionLineCIFit');
						removeChartElement(`.linearRegressionLineCIFit-hitbox`);
					}
					if (CI && CI.linearRegressionLineCIObsLower && CI.linearRegressionLineCIObsLower.length > 0) {
						drawBasicPath(
							mapPoints(colB, CI.linearRegressionLineCIObsUpper.sort((a, b) => b - a)),
							'linearRegressionLineCIObs',
							'Linear Regression CI',
							svg,
							pathTooltip,
						);
						drawBasicPath(
							mapPoints(colB, CI.linearRegressionLineCIObsLower.sort((a, b) => b - a)),
							'linearRegressionLineCIObs',
							'Linear Regression CI',
							svg,
							pathTooltip,
						);
					} else {
						removeChartElement('.linearRegressionLineCIObs');
						removeChartElement(`.linearRegressionLineCIObs-hitbox`);
					}
				} else {
					removeChartElement('.linearRegressionLine');
					removeChartElement(`.linearRegressionLine-hitbox`);
				}
				if (degree2Poly) {
					drawBasicPath(degree2Points, 'degree2PolyLine', 'Quadratic Regression Line', svg, pathTooltip);
					if (CI && CI.degree2PolyLineCIFitLower && CI.degree2PolyLineCIFitLower.length > 0) {
						drawBasicPath(
							mapPoints(colB, CI.degree2PolyLineCIFitLower.sort((a, b) => b - a)),
							'degree2PolyLineCIFit',
							'Quadratic Regression CI',
							svg,
							pathTooltip,
						);
						drawBasicPath(
							mapPoints(colB, CI.degree2PolyLineCIFitUpper.sort((a, b) => b - a)),
							'degree2PolyLineCIFit',
							'Quadratic Regression CI',
							svg,
							pathTooltip,
						);
					} else {
						removeChartElement('.degree2PolyLineCIFit');
						removeChartElement(`.degree2PolyLineCIFit-hitbox`);
					}
					if (CI && CI.degree2PolyLineCIObsLower && CI.degree2PolyLineCIObsLower.length > 0) {
						drawBasicPath(
							mapPoints(colB, CI.degree2PolyLineCIObsLower.sort((a, b) => b - a)),
							'degree2PolyLineCIObs',
							'Quadratic Regression CI',
							svg,
							pathTooltip,
						);
						drawBasicPath(
							mapPoints(colB, CI.degree2PolyLineCIObsUpper.sort((a, b) => b - a)),
							'degree2PolyLineCIObs',
							'Quadratic Regression CI',
							svg,
							pathTooltip,
						);
					} else {
						removeChartElement('.degree2PolyLineCIObs');
						removeChartElement(`.degree2PolyLineCIObs-hitbox`);
					}
				} else {
					removeChartElement(`.degree2PolyLine`);
					removeChartElement(`.degree2PolyLine-hitbox`);
				}
				if (degree3Poly) {
					drawBasicPath(degree3Points, 'degree3PolyLine', 'Cubic Regression Line', svg, pathTooltip);
					if (CI && CI.degree3PolyLineCIFitLower && CI.degree3PolyLineCIFitLower.length > 0) {
						drawBasicPath(
							mapPoints(colB, CI.degree3PolyLineCIFitLower.sort((a, b) => b - a)),
							'degree3PolyLineCIFit',
							'Cubic Regression CI',
							svg,
							pathTooltip,
						);
						drawBasicPath(
							mapPoints(colB, CI.degree3PolyLineCIFitUpper.sort((a, b) => b - a)),
							'degree3PolyLineCIFit',
							'Cubic Regression CI',
							svg,
							pathTooltip,
						);
					} else {
						removeChartElement('.degree3PolyLineCIFit');
						removeChartElement(`.degree3PolyLineCIFit-hitbox`);
					}
					if (CI && CI.degree3PolyLineCIObsLower && CI.degree3PolyLineCIObsLower.length > 0) {
						drawBasicPath(
							mapPoints(colB, CI.degree3PolyLineCIObsLower.sort((a, b) => b - a)),
							'degree3PolyLineCIObs',
							'Cubic Regression CI',
							svg,
							pathTooltip,
						);
						drawBasicPath(
							mapPoints(colB, CI.degree3PolyLineCIObsUpper.sort((a, b) => b - a)),
							'degree3PolyLineCIObs',
							'Cubic Regression CI',
							svg,
							pathTooltip,
						);
					} else {
						removeChartElement('.degree3PolyLineCIObs');
						removeChartElement(`.degree3PolyLineCIObs-hitbox`);
					}
				} else {
					removeChartElement(`.degree3PolyLine`);
					removeChartElement(`.degree3PolyLine-hitbox`);
				}
				if (degree4Poly) {
					drawBasicPath(degree4Points, 'degree4PolyLine', 'Quartic Regression Line', svg, pathTooltip);
				} else {
					removeChartElement(`.degree4PolyLine`);
					removeChartElement(`.degree4PolyLine-hitbox`);
				}
				if (degree5Poly) {
					drawBasicPath(degree5Points, 'degree5PolyLine', '5th Degree Regression Line', svg, pathTooltip);
				} else {
					removeChartElement(`.degree5PolyLine`);
					removeChartElement(`.degree5PolyLine-hitbox`);
				}
				if (degree6Poly) {
					drawBasicPath(degree6Points, 'degree6PolyLine', '6th Degree Regression Line', svg, pathTooltip);
				} else {
					removeChartElement(`.degree6PolyLine`);
					removeChartElement(`.degree6PolyLine-hitbox`);
				}
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ chartOptions, CI ],
	);

	return <div ref={d3Container} />;
}
