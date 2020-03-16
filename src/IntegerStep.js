import React, { useState, useRef } from 'react';
import { Input, Slider, Row, Col } from 'antd';
import { useSpreadsheetDispatch } from './SpreadsheetProvider';
import { FILTER_COLUMN, SET_FILTERS, NUMBER } from './constants';

export default function IntegerStep({ columnID, colMin, colMax, currentMin, currentMax, label, selectedColumns }) {
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const [ min, setMin ] = useState(currentMin || colMin);
	const [ max, setMax ] = useState(currentMax || colMax);
	const refContainer = useRef([ currentMin || colMin, currentMax || colMax ]);

	const onChange = (value) => {
		setMin(value[0]);
		setMax(value[1]);
	};

	const onAfterChange = () => {
		console.log(refContainer);
		const newCopy = selectedColumns.slice();
		const index = newCopy.findIndex((col) => col.id === columnID);
		newCopy[index] = { ...selectedColumns[index], min, max };
		dispatchSpreadsheetAction({
			type: SET_FILTERS,
			selectedColumns: newCopy,
			numberFilters: newCopy.filter((col) => col.type === NUMBER),
		});
		dispatchSpreadsheetAction({ type: FILTER_COLUMN });
	};

	function findGCD(x, y) {
		if (typeof x !== 'number' || typeof y !== 'number') return false;
		x = Math.abs(x);
		y = Math.abs(y);
		while (y) {
			const t = y;
			y = x % y;
			x = t;
		}
		return x;
	}

	return (
		<Row style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
			<Col style={{ textAlign: 'center', width: 300 }} span={12}>
				<span style={{ display: 'flex', alignSelf: 'center', fontSize: '1.1em', width: '100%', textAlign: 'center' }}>
					<Input style={{ maxWidth: 80 }} defaultValue={min.toFixed(2)} />
					{`≤ ${label} ≤`}
					<Input style={{ maxWidth: 80 }} defaultValue={max.toFixed(2)} />
				</span>
				<Slider
					ref={refContainer}
					min={colMin}
					max={colMax}
					step={findGCD(colMin, colMax) / 1000}
					range
					value={[ min, max ]}
					onChange={onChange}
					onAfterChange={onAfterChange}
				/>
			</Col>
		</Row>
	);
}
