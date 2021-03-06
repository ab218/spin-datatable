/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from 'react';
import { InputNumber, Slider, Row, Col } from 'antd';
import { useRowsDispatch, useRowsState, useSelectState } from '../context/SpreadsheetProvider';
import { FILTER_COLUMN, SET_FILTERS, NUMBER, FORMULA } from '../constants';

export default React.memo(function IntegerStep({ columnID, colMin, colMax, currentMin, currentMax, label }) {
	const dispatchRowsAction = useRowsDispatch();
	const [ min, setMin ] = useState(currentMin || colMin);
	const [ max, setMax ] = useState(currentMax || colMax);
	const { selectedColumns } = useSelectState();
	const { filters } = useRowsState();
	const onChange = (value) => {
		setMin(value[0].toFixed(2) / 1);
		setMax(value[1].toFixed(2) / 1);
	};

	const updateSelectedRows = React.useCallback(
		function updateSelectedRows() {
			const { id, filterName } = filters;
			const index = selectedColumns.findIndex((col) => col.id === columnID);
			selectedColumns[index] = { ...selectedColumns[index], min, max };
			dispatchRowsAction({
				type: SET_FILTERS,
				selectedColumns: selectedColumns,
				numberFilters: selectedColumns.filter((col) => col.type === NUMBER || col.type === FORMULA),
				id,
				filterName,
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
		setState((prev) => {
			// update filters when dials are used
			if (prev === value + 1 || prev === value - 1) {
				updateSelectedRows();
			}
			return value;
		});
	}

	return (
		<Row style={{ display: 'flex', width: '100%', justifyContent: 'center', marginTop: 10 }}>
			<Col style={{ textAlign: 'center', width: '100%' }}>
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
						onBlur={updateSelectedRows}
						onPressEnter={updateSelectedRows}
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
});
