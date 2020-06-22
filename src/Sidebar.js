/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import { Divider, Layout, Input } from 'antd';
import { SELECT_COLUMN, REMOVE_SELECTED_CELLS, SET_TABLE_NAME } from './constants';
import { useSelectState, useSelectDispatch, useRowsState, useRowsDispatch } from './context/SpreadsheetProvider';
import { createModelingTypeIcon } from './Modals/ModalShared';

export default React.memo(function Sidebar() {
	const { uniqueColumnIDs, uniqueRowIDs } = useSelectState();
	const { columns, rows, excludedRows, dataTableName } = useRowsState();
	const dispatchSelectAction = useSelectDispatch();
	const dispatchRowsAction = useRowsDispatch();
	return (
		<Layout.Sider width={'20em'} style={{ textAlign: 'left' }} theme={'light'}>
			<Input
				style={{ borderLeft: 'none', borderTop: 'none', borderRight: 'none', borderRadius: 0 }}
				size="large"
				placeholder="Untitled Data Table"
				defaultValue={dataTableName}
				onClick={(e) => {
					dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
				}}
				onKeyDown={(e) => {
					if (e.key === 'Enter') {
						e.target.blur();
					}
				}}
				onBlur={(e) => {
					dispatchRowsAction({ type: SET_TABLE_NAME, dataTableName: e.target.value });
				}}
			/>
			<table style={{ userSelect: 'none', marginTop: '100px', marginLeft: '10px', width: '100%' }}>
				<tbody>
					<tr>
						<td style={{ fontWeight: 'bold' }}>Columns</td>
					</tr>
					{columns &&
						columns.map((column, columnIndex) => (
							<tr
								onClick={(e) => {
									dispatchSelectAction({
										type: SELECT_COLUMN,
										rows: rows,
										columnID: column.id,
										columnIndex,
										selectionActive: e.ctrlKey || e.shiftKey || e.metaKey,
									});
								}}
								key={columnIndex}
							>
								<td className={uniqueColumnIDs.includes(column.id) ? 'sidebar-column-selected' : ''}>
									{createModelingTypeIcon(column.modelingType)}
									<span>{column.label}</span>
								</td>
							</tr>
						))}
				</tbody>
			</table>
			<Divider />
			<table style={{ userSelect: 'none', marginLeft: '10px', width: '100%' }}>
				<tbody>
					<tr>
						<td style={{ width: '80%', fontWeight: 'bold' }}>Rows</td>
						<td style={{ width: '20%', fontWeight: 'bold' }} />
					</tr>
					<tr>
						<td style={{ width: '80%' }}>All Rows</td>
						<td style={{ width: '20%' }}>{rows.length}</td>
					</tr>
					<tr>
						<td style={{ width: '80%' }}>Selected</td>
						<td style={{ width: '20%' }}>{uniqueRowIDs.length}</td>
					</tr>
					<tr>
						<td style={{ width: '80%' }}>Excluded</td>
						<td style={{ width: '20%' }}>{excludedRows.length}</td>
					</tr>
				</tbody>
			</table>
			<Divider />
		</Layout.Sider>
	);
});
