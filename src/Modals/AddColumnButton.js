import React from 'react';
import { Button } from 'antd';
import { useSelectState, useRowsState, useSelectDispatch } from '../context/SpreadsheetProvider';
import { SET_SELECTED_COLUMN } from '../constants';

export default React.memo(function AddColumnButton({ column, setChooseCondition }) {
	const dispatchSelectAction = useSelectDispatch();
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
			setChooseCondition(true);
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
