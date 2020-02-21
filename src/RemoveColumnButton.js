import React from 'react';
import { Icon, Tooltip } from 'antd';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import { SET_SELECTED_COLUMN } from './constants';

export default function RemoveColumnButton({ columnId }) {
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const { selectedColumns } = useSpreadsheetState();
	function removeColumn(columnId) {
		const filteredColumns = selectedColumns.filter((sel) => sel.id !== columnId);
		dispatchSpreadsheetAction({ type: SET_SELECTED_COLUMN, selectedColumns: filteredColumns });
	}
	return (
		<Tooltip onClick={() => removeColumn(columnId)} className="pointer" title="Remove Column">
			<Icon type="close" style={{ color: 'red', marginTop: 20 }} />
		</Tooltip>
	);
}
