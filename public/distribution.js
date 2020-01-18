function unload(e) {
	e.preventDefault();
	// Chrome requires returnValue to be set
	e.returnValue = '';
	window.opener.postMessage('closed', '*');
}

window.addEventListener('unload', unload);

function onClickSelectCells(thisBar, bar, col) {
	let metaKeyPressed = false;
	if (d3.event.metaKey) {
		metaKeyPressed = true;
	} else {
		// If meta key is not held down, remove other highlighted bars
		d3.selectAll('rect').style('fill', '#69b3a2');
	}
	// TODO: If holding meta key and click on bar again, deselect cells
	// if (metaKeyPressed && thisBar.style("fill") === 'red') {
	//   thisBar.style("fill", "#69b3a2");
	//   window.opener.postMessage({
	//     message: 'unclicked',
	//     metaKeyPressed,
	//     vals: bar,
	//   }, '*');
	//   return;
	// }
	thisBar.style('fill', 'red');
	window.opener.postMessage(
		{
			message: 'clicked',
			metaKeyPressed,
			vals: bar,
			col,
		},
		'*',
	);
}

window.opener.postMessage('ready', '*');
const container = document.getElementById('container');
function receiveMessage(event) {
	console.log('TARGET', event);
	const { colB, colYLabel, kurtosis, skew, numberOfBins } = event.data;

	const titleText = document.createTextNode(`Distribution of ${colYLabel}`);
	const titleEl = document.createElement('div');
	titleEl.classList.add('analysis-title');
	titleEl.appendChild(titleText);
	const chartsSpan = document.getElementById('charts');
	document.body.insertBefore(titleEl, chartsSpan);

	// set the dimensions and margins of the graph
	const margin = { top: 20, right: 30, bottom: 40, left: 50 };
	const width = 260 - margin.left - margin.right;
	const height = 300 - margin.top - margin.bottom;

	function makeSvg(id, customWidth) {
		return d3
			.select(`#${id}`)
			.append('svg')
			.attr('width', (customWidth || width) + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);
	}

	// append the histogram svg object to the body of the page
	const histSvg = makeSvg('histogramVis');
	const boxSvg = makeSvg('boxplotVis', 100);

	// Compute summary statistics used for the box:
	const boxDataSorted = colB.sort(d3.ascending);
	const q1 = d3.quantile(boxDataSorted, 0.25);
	const median = d3.quantile(boxDataSorted, 0.5);
	const q3 = d3.quantile(boxDataSorted, 0.75);
	// interQuantileRange = q3 - q1;
	const min = boxDataSorted[0];
	const max = boxDataSorted[boxDataSorted.length - 1];
	const center = 1;
	const boxWidth = 40;

	// Add axes
	const x = d3.scaleLinear().range([ 0, width ]);
	const y = d3
		.scaleLinear()
		// .nice() rounds the tick values to nice numbers
		.domain([ min - min * 0.05, max + max * 0.05 ])
		.nice()
		.range([ height, 0 ]);
	histSvg.append('g').call(d3.axisLeft(y));

	// set the parameters for the histogram
	const histogram = d3
		.histogram()
		.domain(y.domain()) // then the domain of the graphic
		.thresholds(y.ticks(numberOfBins)); // then the numbers of bins

	// And apply this function to data to get the bins
	const bins = histogram(boxDataSorted);

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
	histSvg.append('g').attr('transform', 'translate(0,' + height + ')').call(d3.axisBottom(x).ticks(5));

	// Histogram Bars
	histSvg
		.selectAll('histBars')
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
		.attr('height', function(d) {
			// The -1 adds a little bit of padding between bars
			return y(d.x0) - y(d.x1) - 1;
		})
		.attr('fill', '#69b3a2')
		.on(`mouseenter`, function() {
			d3.select(this).transition().duration(50).attr('opacity', 0.6);
		})
		.on(`mouseleave`, function() {
			d3.select(this).transition().duration(50).attr('opacity', 1);
		})
		.on('click', function(d) {
			onClickSelectCells(d3.select(this), d, 'y');
		});

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

	const jitterWidth = 10;
	const jitter = jitterWidth / 2 + Math.random() * jitterWidth;

	boxSvg
		.selectAll('indPoints')
		.data(boxDataSorted)
		.enter()
		.append('circle')
		.attr('cx', function(d) {
			return center - boxWidth / 10;
		})
		.attr('cy', function(d) {
			return y(d) - jitter;
		})
		.attr('r', 4)
		.style('fill', 'white')
		.attr('stroke', 'black');

	const template = `<div style="text-align: center; margin: 0 3em;">
            <h4>Quantiles</h4>
              <table style="width: 100%;">
                <tr>
                  <td>100.0%:</td>
                  <td>Maximum</td>
                  <td>${boxDataSorted[boxDataSorted.length - 1]}</td>
                </tr>
                <tr>
                  <td>99.5%:</td>
                  <td></td>
                  <td>${d3.quantile(boxDataSorted, 0.995).toFixed(6) / 1}</td>
                </tr>
                <tr>
                  <td>97.5%:</td>
                  <td></td>
                  <td>${d3.quantile(boxDataSorted, 0.975).toFixed(6) / 1}</td>
                </tr>
                <tr>
                  <td>90.0%:</td>
                  <td></td>
                  <td>${d3.quantile(boxDataSorted, 0.9).toFixed(6) / 1}</td>
                </tr>
                <tr>
                  <td>75.0%:</td>
                  <td>Quartile 3</td>
                  <td>${q3.toFixed(6) / 1}</td>
                </tr>
                <tr>
                  <td>50.0%:</td>
                  <td>Median</td>
                  <td>${median}</td>
                </tr>
                <tr>
                  <td>25.0%:</td>
                  <td>Quartile 1</td>
                  <td>${q1.toFixed(6) / 1}</td>
                </tr>
                <tr>
                  <td>10.0%:</td>
                  <td></td>
                  <td>${d3.quantile(boxDataSorted, 0.1).toFixed(6) / 1}</td>
                </tr>
                <tr>
                  <td>2.5%:</td>
                  <td></td>
                  <td>${d3.quantile(boxDataSorted, 0.025).toFixed(6) / 1}</td>
                </tr>
                <tr>
                  <td>0.5%:</td>
                  <td></td>
                  <td>${d3.quantile(boxDataSorted, 0.005).toFixed(6) / 1}</td>
                </tr>
                <tr>
                  <td>0.0%:</td>
                  <td>Minimum</td>
                  <td>${boxDataSorted[0]}</td>
                </tr>
              </table>
            <h4>Summary Statistics</h4>
              <table style="width: 100%;">
                <tr>
                  <td>Mean:</td>
                  <td>${d3.mean(boxDataSorted).toFixed(6) / 1}</td>
                </tr>
                <tr>
                  <td>Std Dev:</td>
                  <td>${d3.deviation(colB).toFixed(6) / 1}</td>
                </tr>
                <tr>
                  <td>Count:</td>
                  <td>${boxDataSorted.length}</td>
                </tr>
                <tr>
                  <td>Skewness:</td>
                  <td>${skew.toFixed(6) / 1}</td>
                </tr>
                <tr>
                  <td>Kurtosis:</td>
                  <td>${kurtosis.toFixed(6) / 1}</td>
                </tr>
              </table>
          </div>`;
	const doc = new DOMParser().parseFromString(template, 'text/html');
	container.appendChild(doc.body.firstChild);
	window.removeEventListener('message', receiveMessage);
}

window.addEventListener('message', receiveMessage, false);
