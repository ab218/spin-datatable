import React from 'react';
import { Button } from 'antd';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import { SET_SELECTED_COLUMN } from './constants';

export default function AddColumnButton({ clickedColumn }) {
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const { rows, selectedColumns } = useSpreadsheetState();
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
			dispatchSpreadsheetAction({ type: SET_SELECTED_COLUMN, selectedColumns: selectedColumns.concat(columnObject) });
		}
	}
	return (
		<Button disabled={!clickedColumn} style={{ width: 100, marginTop: 10 }} onClick={addColumn}>
			Add
		</Button>
	);
}
