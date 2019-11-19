// set the dimensions and margins of the graph
const margin = { top: 20, right: 30, bottom: 40, left: 50 };
const width = 260 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// append the histogram svg object to the body of the page
const histSvg = d3
	.select('#histogramVis')
	.append('svg')
	.attr('width', width + margin.left + margin.right)
	.attr('height', height + margin.top + margin.bottom)
	.append('g')
	.attr('transform', `translate(${margin.left}, ${margin.top})`);

// append the histogram svg object to the body of the page
const boxSvg = d3
	.select('#boxplotVis')
	.append('svg')
	.attr('width', width + margin.left + margin.right)
	.attr('height', height + margin.top + margin.bottom)
	.append('g')
	.attr('transform', `translate(${margin.left}, ${margin.top})`);

// Parse the Data
const boxData = [ 12, 10, 7, 6, 2, 10, 9, 6, 4, 4, 12, 9, 8, 3, 11, 8, 7, 6, 2, 11, 10, 7, 5, 3, 5 ];
const nBins = 12;

// Compute summary statistics used for the box:
const boxDataSorted = boxData.sort(d3.ascending);
const q1 = d3.quantile(boxDataSorted, 0.25);
const median = d3.quantile(boxDataSorted, 0.5);
const q3 = d3.quantile(boxDataSorted, 0.75);
// const interQuantileRange = q3 - q1;
const min = boxDataSorted[0];
const max = boxDataSorted[boxDataSorted.length - 1];
const center = 1;
const boxWidth = 40;

// Add X axis
const x = d3.scaleLinear().range([ 0, width ]);

// Y axis
const y = d3.scaleLinear().range([ height, 0 ]).domain([ Math.min(...boxData) - 1, Math.max(...boxData) + 2 ]);
histSvg.append('g').call(d3.axisLeft(y));

// set the parameters for the histogram
const histogram = d3
	.histogram()
	.value(function(d) {
		return d;
	}) // I need to give the vector of value
	.domain(y.domain()) // then the domain of the graphic
	.thresholds(y.ticks(nBins)); // then the numbers of bins

// And apply this function to data to get the bins
const bins = histogram(boxData);

function maxBinLength(arr) {
	let highest = 0;
	for (let i = 0; i < arr.length; i++) {
		if (arr[i].length > highest) {
			highest = arr[i].length;
		}
	}
	return highest;
}

x.domain([ 0, maxBinLength(bins) ]);
histSvg
	.append('g')
	.attr('transform', 'translate(0,' + height + ')')
	.call(d3.axisBottom(x))
	.selectAll('text')
	.attr('transform', 'translate(-10,0)rotate(-45)')
	.style('text-anchor', 'end');

// Histogram Bars
histSvg
	.selectAll('myRect')
	.data(bins)
	.enter()
	.append('rect')
	.attr('x', 1)
	.attr('y', function(d) {
		return y(d.x1);
	})
	.attr('width', function(d) {
		return x(d.length);
	})
	.attr('height', 22)
	.attr('fill', '#69b3a2');

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
	.attr('y1', function(d) {
		return y(d);
	})
	.attr('y2', function(d) {
		return y(d);
	})
	.attr('stroke', 'black');

var jitterWidth = 10;
boxSvg
	.selectAll('indPoints')
	.data(boxData)
	.enter()
	.append('circle')
	.attr('cx', function(d) {
		return center - boxWidth / 10;
	})
	.attr('cy', function(d) {
		return y(d) - jitterWidth / 2 + Math.random() * jitterWidth;
	})
	.attr('r', 4)
	.style('fill', 'white')
	.attr('stroke', 'black');
