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

export const potatoLiverData = `35	3	1.0606060606	Liver
  32	5.9	5.4237288136	Liver
  36	4.9	7.3469387755	Liver
  40	4	10	Liver
  41	9	4.5555555556	Liver
  40	7.8	5.1282051282	Liver
  41	8.5	4.8235294118	Liver
  23	6.5	3.5384615385	Liver
  46	3.4	13.529411765	Liver
  45	3.1	14.516129032	Liver
  4	14.9	0.2684563758	Potato
  7	26.7	0.2621722846	Potato
  5	22.1	0.2262443439	Potato
  6	29.6	0.2027027027	Potato
  5	26.8	0.1865671642	Potato
  6	32.1	0.1869158879	Potato
  7	32.9	0.2127659574	Beer
  6	33.4	0.1796407186	Beer
  5	32.7	0.1529051988	Beer
  5	31.6	0.1582278481	Beer`;
