import { CONTINUOUS, NOMINAL, STRING, FORMULA, NUMBER } from './../constants';

// dummy data
export const statsColumns = [
	{ id: '_abc1_', modelingType: CONTINUOUS, type: NUMBER, units: 'ml', label: 'Volume Displaced', description: '' },
	{ id: '_abc2_', modelingType: CONTINUOUS, type: NUMBER, units: 'sec', label: 'Time', description: '' },
	{
		id: '_abc3_',
		modelingType: CONTINUOUS,
		formula: { expression: '_abc1_/_abc2_', IDs: [ '_abc1_, _abc2_' ] },
		type: FORMULA,
		units: 'ml/sec',
		label: 'Rate',
		description: '',
	},
	{ id: '_abc4_', modelingType: NOMINAL, type: STRING, units: '', label: 'Catalase Solution', description: '' },
];

// const startingColumn = [
// 	{
// 		id: '_abc1_',
// 		modelingType: CONTINUOUS,
// 		type: NUMBER,
// 		units: '',
// 		label: 'Column 1',
// 		description: '',
// 	},
// ];

export const potatoLiverData = `35	3	11.66667	Liver
32	5.9	5.42373	Liver
36	4.9	7.34694	Liver
40	4	10	Liver
41	9	4.55556	Liver
40	7.8	5.12821	Liver
41	8.5	4.82353	Liver
23	6.5	3.53846	Liver
46	3.4	13.52941	Liver
45	3.1	14.51613	Liver
4	14.9	0.26846	Potato
7	26.7	0.26217	Potato
5	22.1	0.22624	Potato
6	29.6	0.20270	Potato
5	26.8	0.18657	Potato
6	32.1	0.18692	Potato
7	32.9	0.21277	Beer
6	33.4	0.17964	Beer
5	32.7	0.15291	Beer
5	31.6	0.15823	Beer`;
