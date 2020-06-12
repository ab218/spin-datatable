import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import './analysis-window.css';
import { useSelectDispatch, useRowsState } from '../context/SpreadsheetProvider';

const normalPointSize = 2;
const highlightedPointColor = 'red';
const highlightedPointSize = normalPointSize * 2.5;
const clickedBarPointSize = normalPointSize * 2;
const normalBarFill = '#69b3a2';
const clickedBarFill = 'red';
const normalPointFill = 'black';
const margin = { top: 100, right: 70, bottom: 70, left: 50 };
const width = 300;
const height = 300;
const svgWidth = width + margin.left + margin.right;
const svgHeight = height + margin.top + margin.bottom;
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
			if (!pathTooltip) return;
			pathTooltip.transition().duration(200).style('opacity', 0.9);
			pathTooltip.html(title).style('left', d3.event.pageX + 'px').style('top', d3.event.pageY - 28 + 'px');
		})
		.on(`mouseleave`, function() {
			if (!pathTooltip) return;
			pathTooltip.transition().duration(500).style('opacity', 0);
		});
};

function drawHistogramBorders(
	svg,
	yPoints,
	xPoints,
	histogramBinTooltip,
	dispatchSelectAction,
	excludedRows,
	rows,
	columns,
	colY,
	colX,
) {
	// Histogram borders. Lower number = higher bars
	const barHeight = 150;
	const barsY = d3.scaleLinear().range([ height, barHeight ]);
	barsY.domain([ 0, yPoints.length ]);
	const barsX = d3.scaleLinear().range([ 0, 250 ]);
	barsX.domain([ 0, xPoints.length ]);

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
	const yPointsBins = histogramY(yPoints);
	const xPointsBins = histogramX(xPoints);

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
		const metaKeyPressed = d3.event.metaKey;
		if (!metaKeyPressed) {
			svg.selectAll('.point').style('fill', normalPointFill).attr('r', normalPointSize);
			svg.selectAll('rect').style('fill', normalBarFill);
		}
		thisBar.style('fill', clickedBarFill);
		svg
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

		const selectedColumn = col === 'x' ? colX.id : colY.id;
		const columnIndex = columns.findIndex((col) => col.id === selectedColumn);
		if (!metaKeyPressed) {
			dispatchSelectAction({ type: 'REMOVE_SELECTED_CELLS' });
		}
		const rowIndexes = rows.reduce((acc, row, rowIndex) => {
			return !excludedRows.includes(row.id) && bar.includes(Number(row[selectedColumn])) ? acc.concat(rowIndex) : acc;
		}, []);
		dispatchSelectAction({ type: 'SELECT_CELLS', rowIndexes, columnIndex: columnIndex, rows, columns });
	}
	// Histogram Bar X axis
	svg
		.selectAll('xHistBars')
		.data(xPointsBins)
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
		.data(yPointsBins)
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
		.attr('x', width + 5)
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
	const sortedOutput = output.sort((a, b) => b[0] - a[0]);
	return sortedOutput;
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

export default function D3Container({ data, chartOptions, CI, alpha }) {
	const d3Container = useRef(null);
	const { reg1, reg2, reg3, reg4, reg5, reg6, colY, colX, coordinates } = data;
	const dispatchSelectAction = useSelectDispatch();
	const { excludedRows, rows, columns } = useRowsState();
	const {
		histogramBorders,
		linearRegressionLine,
		degree2Poly,
		degree3Poly,
		degree4Poly,
		degree5Poly,
		degree6Poly,
	} = chartOptions;

	const [ linearRegressionPoints, setLinearRegressionPoints ] = useState([]);
	const [ degree2Points, setDegree2Points ] = useState([]);
	const [ degree3Points, setDegree3Points ] = useState([]);
	const [ degree4Points, setDegree4Points ] = useState([]);
	const [ degree5Points, setDegree5Points ] = useState([]);
	const [ degree6Points, setDegree6Points ] = useState([]);

	const xPoints = coordinates.map((a) => a[0]).sort(d3.ascending);
	const yPoints = coordinates.map((a) => a[1]).sort(d3.ascending);

	useEffect(
		() => {
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
			d3
				.select(d3Container.current)
				.append('div')
				.attr('class', 'regression-line tooltip')
				.attr('id', 'regression-line-tooltip')
				.style('opacity', 0);
			d3
				.select(d3Container.current)
				.append('div')
				.attr('class', 'histogram-border tooltip')
				.attr('id', 'histogram-border-tooltip')
				.style('opacity', 0);
			const linearRegressionCoefficients = reg1.stats['polynomial'];
			const degree2PolyCoefficients = reg2.stats['polynomial'];
			const degree3PolyCoefficients = reg3.stats['polynomial'];
			const degree4PolyCoefficients = reg4.stats['polynomial'];
			const degree5PolyCoefficients = reg5.stats['polynomial'];
			const degree6PolyCoefficients = reg6.stats['polynomial'];
			const linearRegressionEquation = (x) => linearRegressionCoefficients[0] + linearRegressionCoefficients[1] * x;
			const xDomainMin = x.domain()[0];
			const xDomainMax = x.domain()[1];
			// lower divisor = less points = better performance
			const step = (xDomainMax - xDomainMin) / 25;
			setLinearRegressionPoints(createPoints(x.domain(), step, linearRegressionEquation));
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
			setDegree2Points(createPoints(x.domain(), step, poly2equation));
			setDegree3Points(createPoints(x.domain(), step, poly3equation));
			setDegree4Points(createPoints(x.domain(), step, poly4equation));
			setDegree5Points(createPoints(x.domain(), step, poly5equation));
			setDegree6Points(createPoints(x.domain(), step, poly6equation));
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	const chartContainer = d3.select(d3Container.current);
	const svg = chartContainer.select('g');
	const pathTooltip = chartContainer.select('#regression-line-tooltip');
	const removeChartElement = (className) => chartContainer.selectAll(className).remove();

	// initialize chart with static features (axes and points)
	useEffect(
		() => {
			if (data && d3Container.current) {
				const pointTooltip = d3
					.select(d3Container.current)
					.append('div')
					.attr('class', 'point tooltip')
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

	useEffect(
		() => {
			const chartContainer = d3.select(d3Container.current);
			const svg = chartContainer.select('g');
			const histogramBinTooltip = chartContainer.select('#histogram-border-tooltip');
			const removeChartElement = (className) => chartContainer.selectAll(className).remove();
			if (histogramBorders) {
				drawHistogramBorders(
					svg,
					yPoints,
					xPoints,
					histogramBinTooltip,
					dispatchSelectAction,
					excludedRows,
					rows,
					columns,
					colY,
					colX,
				);
			} else {
				removeChartElement(`.histogramBorders`);
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ histogramBorders ],
	);

	useEffect(
		() => {
			if (linearRegressionLine) {
				drawBasicPath(linearRegressionPoints, 'linearRegressionLine', 'Linear Regression Line', svg, pathTooltip);
			} else {
				removeChartElement('.linearRegressionLine');
				removeChartElement(`.linearRegressionLine-hitbox`);
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ linearRegressionLine ],
	);

	useEffect(
		() => {
			if (d3Container.current && data && chartOptions) {
				if (degree2Poly) {
					drawBasicPath(degree2Points, 'degree2PolyLine', 'Quadratic Regression Line', svg, pathTooltip);
				} else {
					removeChartElement(`.degree2PolyLine`);
					removeChartElement(`.degree2PolyLine-hitbox`);
				}
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ degree2Poly ],
	);

	useEffect(
		() => {
			if (d3Container.current && data && chartOptions) {
				if (degree3Poly) {
					drawBasicPath(degree3Points, 'degree3PolyLine', 'Quadratic Regression Line', svg, pathTooltip);
				} else {
					removeChartElement(`.degree3PolyLine`);
					removeChartElement(`.degree3PolyLine-hitbox`);
				}
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ degree3Poly ],
	);

	useEffect(
		() => {
			if (d3Container.current && data && chartOptions) {
				if (degree4Poly) {
					drawBasicPath(degree4Points, 'degree4PolyLine', 'Quadratic Regression Line', svg, pathTooltip);
				} else {
					removeChartElement(`.degree4PolyLine`);
					removeChartElement(`.degree4PolyLine-hitbox`);
				}
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ degree4Poly ],
	);

	useEffect(
		() => {
			if (d3Container.current && data && chartOptions) {
				if (degree5Poly) {
					drawBasicPath(degree5Points, 'degree5PolyLine', '5th Degree Regression Line', svg, pathTooltip);
				} else {
					removeChartElement(`.degree5PolyLine`);
					removeChartElement(`.degree5PolyLine-hitbox`);
				}
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ degree5Poly ],
	);

	useEffect(
		() => {
			if (d3Container.current && data && chartOptions) {
				if (degree6Poly) {
					drawBasicPath(degree6Points, 'degree6PolyLine', '6th Degree Regression Line', svg, pathTooltip);
				} else {
					removeChartElement(`.degree6PolyLine`);
					removeChartElement(`.degree6PolyLine-hitbox`);
				}
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ degree6Poly ],
	);

	function updateConfCurves(degree, data, curveClass, title) {
		const chartContainer = d3.select(d3Container.current);
		const svg = chartContainer.select('g');
		const curveClassFit = `${curveClass}Fit`;
		const curveClassObs = `${curveClass}Obs`;
		const dotCurveClassFit = `.${curveClass}Fit`;
		const dotCurveClassObs = `.${curveClass}Obs`;
		const hitboxClassFit = `.${curveClass}Fit-hitbox`;
		const hitboxClassObs = `.${curveClass}Obs-hitbox`;
		// const pathTooltip = chartContainer.select('#regression-line-tooltip');
		const removeChartElement = (className) => chartContainer.selectAll(className).remove();
		const coordinatesX = coordinates.map((coord) => coord[0]);
		if (CI && CI[degree].fit) {
			removeChartElement(dotCurveClassFit);
			removeChartElement(hitboxClassFit);
			drawBasicPath(mapPoints(coordinatesX, data.ci[alpha].mean_ci_upper), curveClassFit, title, svg, null);
			drawBasicPath(mapPoints(coordinatesX, data.ci[alpha].mean_ci_lower), curveClassFit, title, svg, null);
		} else {
			removeChartElement(dotCurveClassFit);
			removeChartElement(hitboxClassFit);
		}
		if (CI && CI[degree].obs) {
			removeChartElement(dotCurveClassObs);
			removeChartElement(hitboxClassObs);
			drawBasicPath(mapPoints(coordinatesX, data.ci[alpha].obs_ci_upper), curveClassObs, title, svg, null);
			drawBasicPath(mapPoints(coordinatesX, data.ci[alpha].obs_ci_lower), curveClassObs, title, svg, null);
		} else {
			removeChartElement(dotCurveClassObs);
			removeChartElement(hitboxClassObs);
		}
	}

	useEffect(
		() => {
			updateConfCurves('degree1', reg1, 'linearRegressionLineCI', 'Linear Regression CI');
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ CI.degree1, alpha ],
	);

	useEffect(
		() => {
			updateConfCurves('degree2', reg2, 'degree2PolyLineCI', 'Quadratic Regression CI');
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ CI.degree2, alpha ],
	);

	useEffect(
		() => {
			updateConfCurves('degree3', reg3, 'degree3PolyLineCI', 'Cubic Regression CI');
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ CI.degree3, alpha ],
	);

	return <div ref={d3Container} />;
}
