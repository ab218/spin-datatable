import React from 'react';
import { Slider, Row, Col } from 'antd';
import { useSpreadsheetDispatch } from './SpreadsheetProvider';
import { FILTER_COLUMN } from './constants';

export default function IntegerStep({ column, colMin, colMax, selectedColumns }) {
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();

	const onChange = function(value) {
		const min = value[0];
		const max = value[1];
		const newCopy = selectedColumns.slice();
		const index = newCopy.findIndex((col) => col.id === column.id);
		newCopy[index] = { ...selectedColumns[index], min, max };
		dispatchSpreadsheetAction({ type: FILTER_COLUMN, selectedColumns: newCopy });
	};

	return (
		<Row style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
			<Col style={{ textAlign: 'center', width: 300 }} span={12}>
				<span
					style={{ alignSelf: 'center', fontSize: '1.1em', minWidth: 100, textAlign: 'center' }}
				>{`${colMin} ≤ ${column.label} ≤ ${colMax}`}</span>
				<Slider min={colMin} max={colMax} range={true} defaultValue={[ colMin, colMax ]} onChange={onChange} />
			</Col>
		</Row>
	);
}
