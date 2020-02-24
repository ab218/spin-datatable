import React, { useState } from 'react';
import { Slider, Row, Col } from 'antd';
import { useSpreadsheetDispatch } from './SpreadsheetProvider';
import { FILTER_COLUMN, SET_FILTERS } from './constants';

export default function IntegerStep({ columnId, colMin, colMax, currentMin, currentMax, label, selectedColumns }) {
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const [ min, setMin ] = useState(currentMin || colMin);
	const [ max, setMax ] = useState(currentMax || colMax);

	const onChange = (value) => {
		setMin(value[0]);
		setMax(value[1]);
	};

	const onAfterChange = () => {
		const newCopy = selectedColumns.slice();
		const index = newCopy.findIndex((col) => col.id === columnId);
		newCopy[index] = { ...selectedColumns[index], min, max };
		dispatchSpreadsheetAction({
			type: SET_FILTERS,
			selectedColumns: newCopy,
			filters: { numberFilters: newCopy.filter((col) => col.type === 'Number') },
		});
		dispatchSpreadsheetAction({ type: FILTER_COLUMN });
	};

	return (
		<Row style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
			<Col style={{ textAlign: 'center', width: 300 }} span={12}>
				<span style={{ alignSelf: 'center', fontSize: '1.1em', minWidth: 100, textAlign: 'center' }}>
					{`${colMin} ≤ ${label} ≤ ${colMax}`}
				</span>
				<Slider
					min={colMin}
					max={colMax}
					range
					value={[ min, max ]}
					onChange={onChange}
					step={(colMax / 100).toFixed(2)}
					onAfterChange={onAfterChange}
				/>
			</Col>
		</Row>
	);
}
