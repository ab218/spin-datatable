import React from 'react';
import { Button } from 'antd';
import { useSelectState, useRowsState, useRowsDispatch, useSelectDispatch } from '../context/SpreadsheetProvider';
import { SET_SELECTED_COLUMN } from '../constants';

export default React.memo(function AddColumnButton({ column }) {
	const dispatchSelectAction = useSelectDispatch();
	const dispatchRowsAction = useRowsDispatch();
	const { selectedColumns } = useSelectState();
	const { rows } = useRowsState();
	const colVals = rows.map((row) => Number(row[column.id])).filter((x) => x);
	const colMax = Math.max(...colVals);
	const colMin = Math.min(...colVals);
	const addedColumns = selectedColumns.some(({ id }) => id === column.id);
	function addColumn() {
		if (!addedColumns) {
			const columnObject = {
				...column,
				colMin,
				colMax,
			};
			dispatchSelectAction({ type: SET_SELECTED_COLUMN, selectedColumns: selectedColumns.concat(columnObject) });
			// select all possible when first column is added
			if (selectedColumns.length === 0) {
				dispatchRowsAction({
					type: 'SET_FILTERS',
					selectedColumns: selectedColumns,
					numberFilters: selectedColumns.filter((col) => col.type === 'NUMBER' || col.type === 'FORMULA'),
				});
				dispatchRowsAction({ type: 'FILTER_COLUMN' });
			}
		}
	}

	if (
		column.type !== 'String' &&
		(colMin === Infinity || colMax === Infinity || colMin === -Infinity || colMax === -Infinity)
	) {
		return <React.Fragment />;
	}
	return (
		<Button disabled={addedColumns} style={{ width: 150 }} onClick={addColumn}>
			{column.label}
		</Button>
	);
});
