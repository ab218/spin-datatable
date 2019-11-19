const histy = histogram.values
	.map((_, i) => {
		return [ histogram.ticks[i], histogram.values[i] ];
	})
	.sort();
const options = {
	chart: {
		marginTop: 100,
		height: 400,
		width: 400,
	},
	credits: false,
	title: {
		text: `Distribution of ${colYLabel}`,
	},
	xAxis: [
		{
			title: { text: 'Data' },
		},
		{
			title: { text: 'Histogram' },
			opposite: true,
		},
	],

	yAxis: [
		{
			title: { text: 'Data' },
		},
		{
			title: { text: 'Histogram' },
			opposite: true,
		},
	],
	legend: {
		layout: 'vertical',
		align: 'right',
		verticalAlign: 'middle',
	},

	plotOptions: {
		series: {
			jitter: {
				x: 0.3,
				y: 0.3,
			},
			label: {
				connectorAllowed: false,
			},
			stickyTracking: false,
			// events: {
			//   legendItemClick: function () {
			//     if (this.visible) {
			//       return false;
			//     } else {
			//       let series = this.chart.series,
			//       i = series.length,
			//       otherSeries;
			//       while (i--) {
			//         otherSeries = series[i]
			//         if (otherSeries !== this && otherSeries.visible) {
			//           otherSeries.hide();
			//         }
			//       }
			//     }
			//   }
			// },
		},
	},
	series: [
		// {
		//   name: 'Scatter',
		//   type: 'scatter',
		//   id: 's2',
		//   data: colB,
		//   visible: false,
		//   borderWidth: 0,
		// },
		{
			borderWidth: 0,
			id: 's1',
			name: 'Boxplot',
			type: 'boxplot',
			yAxis: 0,
			xAxis: 0,
			visible: false,
			medianColor: 'red',
			// data: [boxPlotData.values]
			data: [
				{
					high: boxPlotData[8],
					q3: boxPlotData[5],
					median: boxPlotData[4],
					q1: boxPlotData[3],
					low: boxPlotData[0],
				},
			],
		},
		{
			name: 'Histogram',
			type: 'bar',
			yAxis: 1,
			xAxis: 1,
			id: 's1',
			borderWidth: 0,
			data: histy,
		},
		// {
		//   id: 'outliers',
		//   name: 'Outliers',
		//   type: 'scatter',
		//   linkedTo: 'boxplot',
		//   color: Highcharts.getOptions().colors[2],
		//   marker: {
		//     enabled: true,
		//     radius: 2,
		//     fillColor: 'transparent',
		//     lineColor: 'rgba(40,40,56,0.5)',
		//     lineWidth: 1
		//   },
		//   // data: [boxPlotData.outliers]
		// }
	],

	responsive: {
		rules: [
			{
				condition: {
					maxWidth: 500,
				},
				chartOptions: {
					legend: {
						layout: 'horizontal',
						align: 'center',
						verticalAlign: 'bottom',
					},
				},
			},
		],
	},
};
const chart = Highcharts.chart(container, options);
// Hack to fix the ticks not appearing correctly on first render
chart.series[0].hide();
chart.series[0].show();
