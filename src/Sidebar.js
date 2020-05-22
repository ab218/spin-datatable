/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import { Divider, Layout } from 'antd';
import './App.css';
import { SELECT_COLUMN } from './constants';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import { createModelingTypeIcon } from './Modals/ModalShared';

export default function Sidebar() {
	const { columns, excludedRows, rows, uniqueColumnIDs, uniqueRowIDs } = useSpreadsheetState();
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	return (
		<Layout.Sider width={'20em'} style={{ textAlign: 'left' }} theme={'light'}>
			<table style={{ marginTop: '100px', marginLeft: '10px', width: '100%' }}>
				<tbody>
					<tr>
						<td style={{ fontWeight: 'bold' }}>Columns</td>
					</tr>
					{columns &&
						columns.map((column, columnIndex) => (
							<tr
								onClick={(e) => {
									dispatchSpreadsheetAction({
										type: SELECT_COLUMN,
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
			<table style={{ marginLeft: '10px', width: '100%' }}>
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
}
