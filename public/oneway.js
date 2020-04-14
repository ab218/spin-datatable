/*global d3 clickedBarPointSize highlightedPointColor highlightedPointSize normalPointSize normalBarFill createPoints reversedLine valueLine drawBasicPath toggleChartElement generateTemplate generateEquationTemplate addOrSubtract unload evaluatePValue toggleCenteredPoly onClickSelectCells chartOptionsTemplate*/
window.addEventListener('unload', unload);
window.opener.postMessage('ready', '*');

// magic globals
const margin = { top: 100, right: 50, bottom: 20, left: 50 };
const width = 400;
const height = 400;
const svgWidth = width + margin.left + margin.right + 100;
const svgHeight = height + margin.top + margin.bottom + 100;
const container = document.getElementById('container');

const svg = d3
	.select('.chart')
	.append('svg')
	.attr('width', svgWidth)
	.attr('height', svgHeight)
	.append('g')
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// So that lines stay within the bounds of the graph
svg.append('clipPath').attr('id', 'clip').append('rect').attr('width', width).attr('height', height);

function receiveMessage(event) {
	console.log('TARGET', event);
	const {
		ordered_differences_report,
		x_groups_lists,
		bartlett,
		levene,
		means_std,
		summary_table,
		anova,
		colY,
		colX,
		coordinates,
	} = event.data;

	const groups = coordinates.map((coord) => coord[0]);
	const lists = Object.values(x_groups_lists).map((x) => Object.values(x));

	const meanTooltip = d3.select('body').append('div').attr('class', 'mean tooltip').style('opacity', 0);
	const pointTooltip = d3.select('body').append('div').attr('class', 'point tooltip').style('opacity', 0);
	const x = d3.scaleBand().domain(groups).rangeRound([ 0, width - margin.right ]).paddingInner(1).paddingOuter(0.5);

	const y = d3.scaleLinear().range([ height, 0 ]);
	// define the line
	// const valueLine = d3.line().x((d) => x(d[1])).y((d) => y(d[0]));
	// const reversedLine = d3.line().x((d) => x(d[0])).y((d) => y(d[1]));

	const xAxis = d3.axisBottom().scale(x).ticks(10, 's').tickSizeOuter(0);
	const yAxis = d3.axisLeft().scale(y).ticks(10, 's');

	const titleEl = document.createElement('div');
	const titleText = document.createTextNode(
		`Oneway Analysis of ${colY.label} ${colY.units ? '(' + colY.units + ')' : ''} By ${colX.label} ${colX.units
			? '(' + colX.units + ')'
			: ''}`,
	);
	titleEl.classList.add('analysis-title');
	titleEl.appendChild(titleText);
	const chartsContainer = document.getElementById('chart');
	document.body.insertBefore(titleEl, chartsContainer);

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
	// x.domain([ xExtent[0] - xRange * 0.05, xExtent[1] + xRange * 0.05 ]).nice();
	y.domain([ yExtent[0] - yRange * 0.05, yExtent[1] + yRange * 0.05 ]).nice();

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

	const xDomainMin = x.domain()[0];
	const xDomainMax = x.domain()[1];

	const summaryOfFit = `<details open style="padding: 10px 30px; text-align: center;">
      <summary class="analysis-summary-title">Oneway Anova</summary>
      <table>
        <tr><td colspan=2 class="table-subtitle">Summary of Fit</td></tr>
        <tr>
          <td style="background-color: E2D7D7; width: 200px;">R-squared</td>
          <td style="text-align: right; width: 150px;">${summary_table.rsquared.toFixed(4) / 1}</td>
        </tr>
        <tr>
          <td style="background-color: E2D7D7; width: 200px;">Adj R-squared</td>
          <td style="text-align: right; width: 150px;">${summary_table.rsquared_adj.toFixed(4) / 1}</td>
        </tr>
        <tr>
          <td style="background-color: E2D7D7; width: 200px;">Root Mean Square Error</td>
          <td style="text-align: right; width: 150px;">${summary_table.root_mean_squared_error.toFixed(4) / 1 / 1}</td>
        </tr>
        <tr>
          <td style="background-color: E2D7D7; width: 200px;">Mean of Response</td>
          <td style="text-align: right; width: 150px;">${summary_table.y_mean}</td>
        </tr>
        <tr>
          <td style="background-color: E2D7D7; width: 200px;">Observations</td>
          <td style="text-align: right; width: 150px;">${summary_table.nobs}</td>
        </tr>
      </table>
      <div style="height: 30px;"></div>
      <table>
        <tr><td colspan=6 class="table-subtitle">Analysis of Variance</td></tr>
        <tr>
          <td style="background-color: E2D7D7; font-weight: bold;">Source</td>
          <td style="width: 50px;" class="table-header right">DF</td>
          <td class="table-header right">Sum of Squares</td>
          <td class="table-header right">Mean Square</td>
          <td class="table-header right">F Ratio</td>
          <td class="table-header right">Prob > F</td>
        </tr>
        <tr>
          <td style="background-color: E2D7D7;">${colX.label}</td>
          <td style="text-align: right; width: 50px;">${anova.df.x}</td>
          <td style="text-align: right; width: 100px;">${anova.sum_sq.x}</td>
          <td style="text-align: right; width: 100px;">${anova.mean_sq.x}</td>
          <td style="text-align: right; width: 100px;">${anova.F.x.toFixed(4) / 1}</td>
          <td style="text-align: right; width: 100px;">${evaluatePValue(anova['PR(>F)'].x)}</td>
        </tr>
        <tr>
          <td style="background-color: E2D7D7;">Error</td>
          <td style="text-align: right; width: 50px;">${anova.df.Residual}</td>
          <td style="text-align: right; width: 100px;">${anova.sum_sq.Residual.toFixed(4) / 1}</td>
          <td style="text-align: right; width: 100px;">${anova.mean_sq.Residual.toFixed(4) / 1}</td>
          <td style="text-align: right; width: 100px;"></td>
          <td style="text-align: right; width: 100px;"></td>
        </tr>
        <tr>
          <td style="background-color: E2D7D7;">C. Total</td>
          <td style="text-align: right; width: 50px;">${anova.df.x + anova.df.Residual}</td>
          <td style="text-align: right; width: 100px;">${(anova.sum_sq.x + anova.sum_sq.Residual).toFixed(4) / 1}</td>
          <td style="text-align: right; width: 100px;"></td>
          <td style="text-align: right; width: 100px;"></td>
          <td style="text-align: right; width: 100px;"></td>
        </tr>
      </table>
      <div style="height: 30px;"></div>
      <table>
        <tr><td colspan=6 class="table-subtitle">Means for Oneway Analysis</td></tr>
        <tr>
          <td style="background-color: E2D7D7; text-align: left; font-weight: bold;">Level</td>
          <td class="table-header right"">Number</td>
          <td class="table-header right"">Mean</td>
          <td class="table-header right">Std Error</td>
          <td class="table-header right">Lower 95%</td>
          <td class="table-header right">Upper 95%</td>
        </tr>
      ${renderMeansTable()}
      </table>
    </details>`;

	function renderMeansTable() {
		const { x, count, mean, sterr } = means_std;
		const numberOfRows = Object.keys(x).length;
		let output = '';
		for (let i = 0; i < numberOfRows; i++) {
			output += `<tr>
          <td style="background-color: E2D7D7;">${x[i]}</td>
          <td style="text-align: right; width: 75px;">${count[i]}</td>
          <td style="text-align: right; width: 75px;">${mean[i].toFixed(4) / 1 / 1}</td>
          <td style="text-align: right; width: 125px;">${sterr[i].toFixed(4) / 1}</td>
          <td style="text-align: right; width: 125px;">0</td>
          <td style="text-align: right; width: 125px;">0</td>
        </tr>`;
		}
		return output;
	}

	function renderMeansStdTable() {
		const { x, count, mean, std, sem } = means_std;
		const numberOfRows = Object.keys(x).length;
		let output = '';
		for (let i = 0; i < numberOfRows; i++) {
			output += `<tr>
          <td style="background-color: E2D7D7;">${x[i]}</td>
          <td style="text-align: right; width: 75px;">${count[i]}</td>
          <td style="text-align: right; width: 75px;">${mean[i]}</td>
          <td style="text-align: right; width: 125px;">${std[i].toFixed(4) / 1}</td>
          <td style="text-align: right; width: 125px;">${sem[i].toFixed(4) / 1}</td>
          <td style="text-align: right; width: 125px;">0</td>
          <td style="text-align: right; width: 125px;">0</td>
        </tr>`;
		}
		return output;
	}

	const meansAndStd = `<details open style="padding: 10px 30px 30px; text-align: center;">
      <summary class="analysis-summary-title">Means And Std Deviations</summary>
      <table>
        <tr>
          <td style="background-color: E2D7D7; font-weight: bold;">Level</td>
          <td class="table-header right">Number</td>
          <td class="table-header right">Mean</td>
          <td class="table-header right">Std Dev</td>
          <td class="table-header right">Std Err Mean</td>
          <td class="table-header right">Lower 95%</td>
          <td class="table-header right">Upper 95%</td>
        </tr>
        ${renderMeansStdTable()}
      </table>
    </details>`;

	function renderQuantilesTable() {
		const { x, y } = x_groups_lists;
		const numberOfRows = Object.keys(x).length;
		let output = '';
		for (let i = 0; i < numberOfRows; i++) {
			output += `<tr>
          <td style="background-color: E2D7D7;">${x[i]}</td>
          <td style="text-align: right; width: 100px;">${y[i][0]}</td>
          <td style="text-align: right; width: 100px;">${d3.quantile(y[i], 0.1)}</td>
          <td style="text-align: right; width: 100px;">${d3.quantile(y[i], 0.25)}</td>
          <td style="text-align: right; width: 100px;">${d3.quantile(y[i], 0.5)}</td>
          <td style="text-align: right; width: 100px;">${d3.quantile(y[i], 0.75)}</td>
          <td style="text-align: right; width: 100px;">${d3.quantile(y[i], 0.9)}</td>
          <td style="text-align: right; width: 100px;">${y[i][y[i].length - 1]}</td>
        </tr>`;
		}
		return output;
	}

	const quantiles = `<details open style="padding: 10px 30px 30px; text-align: center;">
      <summary class="analysis-summary-title">Quantiles</summary>
        <table>
          <tr>
            <td style="background-color: E2D7D7; font-weight: bold;">Level</td>
            <td class="table-header right">Minimum</td>
            <td class="table-header right">10%</td>
            <td class="table-header right">25%</td>
            <td class="table-header right">Median</td>
            <td class="table-header right">75%</td>
            <td class="table-header right">90%</td>
            <td class="table-header right">Maximum</td>
          </tr>
          ${renderQuantilesTable()}
        </table>
    </details>`;

	function renderOrderedDifferencesReportTable() {
		const {
			index,
			coef,
			'std err': std_err,
			t,
			'P>|t|': p_t,
			'Conf. Int. Low': ci_low,
			'Conf. Int. Upp.': ci_upp,
			'pvalue-hs': p,
		} = ordered_differences_report;
		const numberOfRows = Object.keys(index).length;
		let output = '';
		for (let i = 0; i < numberOfRows; i++) {
			output += `<tr>
        <td style="background-color: E2D7D7;">${index[i]}</td>
        <td style="text-align: right; width: 100px;">${coef[i].toFixed(4) / 1}</td>
        <td style="text-align: right; width: 100px;">${std_err[i].toFixed(4) / 1}</td>
        <td style="text-align: right; width: 100px;">${t[i].toFixed(4) / 1}</td>
        <td style="text-align: right; width: 100px;">${evaluatePValue(p[i])}</td>
        </tr>`;
		}
		return output;
	}

	const orderedDifferencesReport = `<details open style="padding: 10px 30px 30px; text-align: center;">
    <summary class="analysis-summary-title">Comparisons for each pair using Student's t</summary>
      <table>
        <tr><td colspan=6 class="table-subtitle">Ordered Differences Report</td></tr>
        <tr>
          <td style="background-color: E2D7D7; font-weight: bold;">Level - Level</td>
          <td class="table-header right">Difference</td>
          <td class="table-header right">Std Err Diff</td>
          <td class="table-header right">t</td>
          <td class="table-header right">p-Value</td>
        </tr>
        ${renderOrderedDifferencesReportTable()}
      </table>
  </details>`;

	const equalVarianceReport = `<details open style="padding: 10px 30px 30px; text-align: center;">
    <summary class="analysis-summary-title">Tests that the Variances are Equal</summary>
      <table>
        <tr>
          <td style="background-color: E2D7D7; font-weight: bold;">Level</td>
          <td class="table-header right">Count</td>
          <td class="table-header right">Std Dev</td>
          <td class="table-header right">MeanAbsDif to Mean</td>
          <td class="table-header right">MeanAbsDif to Median</td>
        </tr>
        ${renderEqualVariancesReportTable()}
        <tr style="height: 30px"></tr>
        <tr>
          <td style="background-color: E2D7D7; text-align: left; width: 100px; font-weight: bold;">Test</td>
          <td class="table-header right">F Ratio</td>
          <td class="table-header right">DFNum</td>
          <td class="table-header right">DFDen</td>
          <td class="table-header right">Prob > F</td>
        </tr>
        <tr>
          <td style="background-color: E2D7D7;">Levene</td>
          <td style="text-align: right; width: 100px;">${levene[0].toFixed(4) / 1}</td>
          <td style="text-align: right; width: 100px;">2</td>
          <td style="text-align: right; width: 100px;">2</td>
          <td style="text-align: right; width: 100px;">${evaluatePValue(levene[1])}</td>
        </tr>
        <tr>
          <td style="background-color: E2D7D7;">Bartlett</td>
          <td style="text-align: right; width: 100px;">${bartlett[0].toFixed(4) / 1}</td>
          <td style="text-align: right; width: 100px;">2</td>
          <td style="text-align: right; width: 100px;">2</td>
          <td style="text-align: right; width: 100px;">${evaluatePValue(bartlett[1])}</td>
        </tr>
      </table>
    </details>`;

	function renderEqualVariancesReportTable() {
		const { x, count, std, madmean, madmed } = means_std;
		const numberOfRows = Object.keys(x).length;
		let output = '';
		for (let i = 0; i < numberOfRows; i++) {
			output += `<tr>
          <td style="background-color: E2D7D7;">${x[i]}</td>
          <td style="text-align: right; width: 100px;">${count[i].toFixed(4) / 1}</td>
          <td style="text-align: right; width: 100px;">${std[i].toFixed(4) / 1}</td>
          <td style="text-align: right; width: 100px;">${madmean[i].toFixed(4) / 1}</td>
          <td style="text-align: right; width: 100px;">${madmed[i].toFixed(4) / 1}</td>
          </tr>`;
		}
		return output;
	}

	const chartOptionsDropdown = `<div style="text-align: center;">
  <h3>Chart Options</h3>
    <select id="chart-options-dropdown" multiple>
      <optgroup>
        <option value="pooledMean">Show Pooled Mean</option>
        <option value="boxPlots">Show Boxplots</option>
      </optgroup>
  </select>
  </div>`;

	const summaryOfFitParsed = new DOMParser().parseFromString(summaryOfFit, 'text/html');
	const meansAndStdParsed = new DOMParser().parseFromString(meansAndStd, 'text/html');
	const quantilesParsed = new DOMParser().parseFromString(quantiles, 'text/html');
	const orderedDifferencesReportParsed = new DOMParser().parseFromString(orderedDifferencesReport, 'text/html');
	const equalVarianceReportParsed = new DOMParser().parseFromString(equalVarianceReport, 'text/html');
	const chartOptionsDropdownParsed = new DOMParser().parseFromString(chartOptionsDropdown, 'text/html');
	chartsContainer.appendChild(chartOptionsDropdownParsed.body.firstChild);
	chartsContainer.appendChild(quantilesParsed.body.firstChild);
	chartsContainer.appendChild(summaryOfFitParsed.body.firstChild);
	chartsContainer.appendChild(meansAndStdParsed.body.firstChild);
	chartsContainer.appendChild(orderedDifferencesReportParsed.body.firstChild);
	chartsContainer.appendChild(equalVarianceReportParsed.body.firstChild);

	function onMouseEnterPoint(d, thisPoint) {
		d3.select(thisPoint).transition().duration(50).attr('r', highlightedPointSize);
		pointTooltip.transition().duration(200).style('opacity', 0.9);
		pointTooltip
			.html(`row: ${d[2]}<br>${colX.label}: ${d[0]}<br>${colY.label}: ${d[1]}`)
			.style('left', d3.event.pageX + 'px')
			.style('top', d3.event.pageY - 28 + 'px');
	}

	function onMouseLeavePoint(d, thisPoint) {
		if (d3.select(thisPoint).style('fill') === highlightedPointColor) {
			d3.select(thisPoint).transition().duration(50).attr('r', clickedBarPointSize);
		} else {
			d3.select(thisPoint).transition().duration(50).attr('r', normalPointSize);
		}
		pointTooltip.transition().duration(500).style('opacity', 0);
	}

	function onMouseEnterMean() {
		// d3.select(thisLine).transition().duration(50).attr('r', highlightedPointSize);
		meanTooltip.transition().duration(200).style('opacity', 0.9);
		meanTooltip
			.html(`Pooled Mean: ${summary_table.y_mean}`)
			.style('left', d3.event.pageX + 'px')
			.style('top', d3.event.pageY - 28 + 'px');
	}

	function onMouseLeaveMean() {
		meanTooltip.transition().duration(500).style('opacity', 0);
	}

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
			onMouseEnterPoint(d, this);
		})
		.on(`mouseleave`, function(d) {
			onMouseLeavePoint(d, this);
		});

	svg
		.append('line') // attach a line
		.style('stroke', 'green') // colour the line
		.attr('stroke-width', 1.5)
		.attr('x1', 0) // x position of the first end of the line
		.attr('y1', y(summary_table.y_mean)) // y position of the first end of the line
		.attr('x2', width - margin.right) // x position of the second end of the line
		.attr('y2', y(summary_table.y_mean))
		.on('mouseenter', onMouseEnterMean)
		.on('mouseleave', onMouseLeaveMean)
		.attr('display', 'none')
		.attr('class', 'pooledMean');

	// Boxplot
	const boxPlotStrokeColor = 'red';
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
		.attr('display', 'none')
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
		.attr('display', 'none')
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
		.attr('display', 'none')
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
		.attr('display', 'none')
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
		.attr('display', 'none')
		.attr('class', 'boxPlots');

	new SlimSelect({
		select: '#chart-options-dropdown',
		onChange: (info) => {
			console.log(info);
			const boxPlots = info.find((inf) => inf.value === 'boxPlots');
			const pooledMean = info.find((inf) => inf.value === 'pooledMean');
			if (boxPlots) {
				d3.selectAll('.boxPlots').attr('display', 'block');
			} else {
				d3.selectAll('.boxPlots').attr('display', 'none');
			}
			if (pooledMean) {
				d3.selectAll('.pooledMean').attr('display', 'block');
			} else {
				d3.selectAll('.pooledMean').attr('display', 'none');
			}
		},
	});
}
window.addEventListener('message', receiveMessage, false);
