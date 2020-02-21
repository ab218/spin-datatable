/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import { Divider, Layout } from 'antd';
import './App.css';
import { SELECT_COLUMN } from './constants';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';

export default function Sidebar() {
	const { columns, excludedRows, rows, uniqueColumnIDs, uniqueRowIDs } = useSpreadsheetState();
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	return (
		<Layout.Sider width={'20em'} style={{ textAlign: 'left' }} theme={'light'}>
			<table style={{ marginTop: '100px', marginLeft: '10px', width: '100%' }}>
				<tbody>
					<tr>
						<td style={{ width: '34%', fontWeight: 'bold' }}>Columns</td>
						<td style={{ width: '66%', fontWeight: 'bold' }} />
					</tr>
					{columns &&
						columns.map((column, columnIndex) => (
							<tr className={uniqueColumnIDs.includes(column.id) ? 'sidebar-column-selected' : ''} key={columnIndex}>
								<td
									onClick={(e) => {
										dispatchSpreadsheetAction({
											type: SELECT_COLUMN,
											columnId: column.id,
											columnIndex,
											selectionActive: e.ctrlKey || e.shiftKey || e.metaKey,
										});
									}}
								>
									{column.label}
								</td>
							</tr>
						))}
				</tbody>
			</table>
			<Divider />
			<table style={{ marginLeft: '10px', width: '100%' }}>
				<tbody>
					<tr>
						<td style={{ width: '34%', fontWeight: 'bold' }}>Rows</td>
						<td style={{ width: '66%', fontWeight: 'bold' }} />
					</tr>
					<tr>
						<td style={{ width: '34%' }}>All Rows</td>
						<td style={{ width: '66%' }}>{rows.length}</td>
					</tr>
					<tr>
						<td style={{ width: '34%' }}>Selected</td>
						<td style={{ width: '66%' }}>{uniqueRowIDs.length}</td>
					</tr>
					<tr>
						<td style={{ width: '34%' }}>Excluded</td>
						<td style={{ width: '66%' }}>{excludedRows.length}</td>
					</tr>
				</tbody>
			</table>
			<Divider />
		</Layout.Sider>
	);
}
