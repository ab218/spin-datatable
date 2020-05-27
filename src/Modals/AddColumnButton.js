import React from 'react';
import { Button } from 'antd';
import { useSelectState, useRowsState, useSelectDispatch } from '../context/SpreadsheetProvider';
import { SET_SELECTED_COLUMN } from '../constants';

export default function AddColumnButton({ clickedColumn }) {
	const dispatchSelectAction = useSelectDispatch();
	const { selectedColumns } = useSelectState();
	const { rows } = useRowsState();
	function addColumn() {
		if (!selectedColumns.some(({ id }) => id === clickedColumn.id)) {
			const colVals = rows.map((row) => Number(row[clickedColumn.id])).filter((x) => x);
			const colMax = Math.max(...colVals);
			const colMin = Math.min(...colVals);
			const columnObject = {
				...clickedColumn,
				colMin,
				colMax,
			};
			dispatchSelectAction({ type: SET_SELECTED_COLUMN, selectedColumns: selectedColumns.concat(columnObject) });
		}
	}
	return (
		<Button disabled={!clickedColumn} style={{ width: 100, margin: '10px 0' }} onClick={addColumn}>
			Add
		</Button>
	);
}
