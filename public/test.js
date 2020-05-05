const yArr = [ 35, 32, 36, 40, 41, 40, 41, 23, 46, 45, 4, 7, 5, 6, 5, 6, 7, 6, 5, 5 ];
const xArr = [ 3, 5.9, 4.9, 4, 9, 7.8, 8.5, 6.5, 3.4, 3.1, 14.9, 26.7, 22.1, 29.6, 26.8, 32.1, 32.9, 33.4, 32.7, 31.6 ];

const formula = (x) => 42.855055 - 1.2455034 * x;

const predictedVals = xArr.map((x) => formula(x));

const xObs = xArr.length;
const xMean = xArr.reduce((a, b) => a + b) / xObs;
const xSD = Math.sqrt(xArr.map((x) => Math.pow(x - xMean, 2)).reduce((a, b) => a + b) / xObs);

const asdf = () => {
	return predictedVals.map((x) => {
		return {
			lower: x - 1.96 * (xSD / Math.sqrt(xObs - 1)),
			upper: x + 1.96 * (xSD / Math.sqrt(xObs - 1)),
		};
	});
};

console.log(asdf(xArr));

/*
Intercept  36.571890  49.138219
x          -1.547187  -0.943820
*/

const anotherFormula = (x) => {
	return {
		lower: -1.547187 * x + 36.57189,
		upper: -0.94382 * x + 49.138219,
	};
};

xArr.map((x) => console.log(anotherFormula(x)));
