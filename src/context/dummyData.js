import { CONTINUOUS, NOMINAL, TEXT, FORMULA, NUMBER } from "./../constants";

export const statsColumns = [
  {
    id: "_abc1_",
    modelingType: CONTINUOUS,
    type: NUMBER,
    units: "ml",
    label: "Volume Displaced",
    description: "",
  },
  {
    id: "_abc2_",
    modelingType: CONTINUOUS,
    type: NUMBER,
    units: "sec",
    label: "Time",
    description: "",
  },
  {
    id: "_abc3_",
    modelingType: CONTINUOUS,
    formula: { expression: "_abc1_/_abc2_", IDs: ["_abc1_, _abc2_"] },
    type: FORMULA,
    units: "ml/sec",
    label: "Rate",
    description: "",
  },
  {
    id: "_abc4_",
    modelingType: NOMINAL,
    type: TEXT,
    units: "",
    label: "Catalase Solution",
    description: "",
  },
  {
    id: "_abc5_",
    modelingType: NOMINAL,
    type: TEXT,
    units: "",
    label: "Animal",
    description: "",
  },
];

export const startingColumn = [
  {
    id: "_abc1_",
    modelingType: CONTINUOUS,
    type: NUMBER,
    units: "",
    label: "Column 1",
    description: "",
  },
];

export const potatoLiverData = `35	3	11.66667	Liver	dog
32	5.9	5.42373	Liver	dog
36	4.9	7.34694	Liver	cat
40	4	10	Liver	dog
41	9	4.55556	Liver	cat
40	7.8	5.12821	Liver	brontosaurus
41	8.5	4.82353	Liver	cat
23	6.5	3.53846	Liver	brontosaurus
46	3.4	13.52941	Liver	cat
45	3.1	14.51613	Liver	brontosaurus
4	14.9	0.26846	Potato	cat
7	26.7	0.26217	Potato	brontosaurus
5	22.1	0.22624	Potato	cat
6	29.6	0.20270	Potato	brontosaurus
5	26.8	0.18657	Potato	cat
6	32.1	0.18692	Potato	dog
7	32.9	0.21277	Beer	cat
6	33.4	0.17964	Beer	dog
5	32.7	0.15291	Beer	cat
5	31.6	0.15823	Beer	dog`;
