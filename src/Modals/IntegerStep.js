/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from 'react';
import { InputNumber, Slider, Row, Col } from 'antd';
import { useRowsDispatch } from '../context/SpreadsheetProvider';
import { FILTER_COLUMN, SET_FILTERS, NUMBER, FORMULA } from '../constants';

export default function IntegerStep({ columnID, colMin, colMax, currentMin, currentMax, label, selectedColumns }) {
	const dispatchRowsAction = useRowsDispatch();
	const [ min, setMin ] = useState(currentMin || colMin);
	const [ max, setMax ] = useState(currentMax || colMax);

	const onChange = (value) => {
		setMin(value[0].toFixed(2) / 1);
		setMax(value[1].toFixed(2) / 1);
	};

	const updateSelectedRows = React.useCallback(
		function updateSelectedRows() {
			const index = selectedColumns.findIndex((col) => col.id === columnID);
			selectedColumns[index] = { ...selectedColumns[index], min, max };
			dispatchRowsAction({
				type: SET_FILTERS,
				selectedColumns: selectedColumns,
				numberFilters: selectedColumns.filter((col) => col.type === NUMBER || col.type === FORMULA),
			});
			dispatchRowsAction({ type: FILTER_COLUMN });
		},
		[ columnID, max, min, selectedColumns ],
	);

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
						justifyContent: 'space-evenly',
						textAlign: 'center',
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
					tipFormatter={(value) => value.toFixed(2)}
					range
					value={[ min, max ]}
					onChange={onChange}
					onAfterChange={updateSelectedRows}
				/>
			</Col>
		</Row>
	);
}
