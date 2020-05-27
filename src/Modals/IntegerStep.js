import React, { useState } from 'react';
import { InputNumber, Slider, Row, Col } from 'antd';
import { useSelectDispatch, useRowsState } from '../context/SpreadsheetProvider';
import { FILTER_COLUMN, SET_FILTERS, NUMBER } from '../constants';

export default function IntegerStep({ columnID, colMin, colMax, currentMin, currentMax, label, selectedColumns }) {
	const dispatchSelectAction = useSelectDispatch();
	const { rows, columns } = useRowsState();
	const [ min, setMin ] = useState(currentMin || colMin);
	const [ max, setMax ] = useState(currentMax || colMax);

	const onChange = (value) => {
		setMin(value[0]);
		setMax(value[1]);
	};

	function updateSelectedRows() {
		const newCopy = selectedColumns.slice();
		const index = newCopy.findIndex((col) => col.id === columnID);
		newCopy[index] = { ...selectedColumns[index], min, max };
		dispatchSelectAction({
			type: SET_FILTERS,
			selectedColumns: newCopy,
			numberFilters: newCopy.filter((col) => col.type === NUMBER),
		});
		dispatchSelectAction({ type: FILTER_COLUMN, rows, columns });
	}

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

	function handleInputChange(value, setState) {
		if (isNaN(value)) return;
		setState(value);
	}

	return (
		<Row style={{ maxWidth: 400, display: 'flex', justifyContent: 'center', marginTop: 10 }}>
			<Col style={{ textAlign: 'center', width: 400 }} span={12}>
				<span
					style={{
						display: 'flex',
						alignSelf: 'center',
						fontSize: '1.1em',
						width: '100%',
						textAlign: 'center',
						justifyContent: 'space-evenly',
						alignItems: 'center',
					}}
				>
					<InputNumber
						onChange={(value) => handleInputChange(value, setMin)}
						style={{ width: 70 }}
						min={colMin}
						max={colMax}
						value={min}
						onPressEnter={updateSelectedRows}
						onBlur={updateSelectedRows}
					/>
					<span style={{ fontSize: '1.2em' }}>≤</span>
					<span style={{ width: 150 }}>{label}</span>
					<span style={{ fontSize: '1.2em' }}>≤</span>
					<InputNumber
						onChange={(value) => handleInputChange(value, setMax)}
						style={{ width: 70 }}
						min={colMin}
						max={colMax}
						value={max}
						onBlur={updateSelectedRows}
						onPressEnter={updateSelectedRows}
					/>
				</span>
				<Slider
					min={colMin}
					max={colMax}
					step={findGCD(colMin, colMax) / 1000}
					range
					value={[ min, max ]}
					onChange={onChange}
					onAfterChange={updateSelectedRows}
				/>
			</Col>
		</Row>
	);
}
