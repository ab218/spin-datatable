/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import './App.css';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import Draggable from 'react-draggable';
import {
	CLOSE_CONTEXT_MENU,
	OPEN_CONTEXT_MENU,
	REMOVE_SELECTED_CELLS,
	SELECT_COLUMN,
	TOGGLE_COLUMN_TYPE_MODAL,
} from './constants';

export default function HeaderRenderer({ dataKey, label, columnIndex, createNewColumns, resizeColumn }) {
	const { columns, contextMenuOpen, uniqueColumnIDs } = useSpreadsheetState();
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	function openModal(e) {
		if (!dataKey) {
			if (columnIndex >= columns.length) {
				createNewColumns(columnIndex + 1 - columns.length);
				return;
			}
		}
		dispatchSpreadsheetAction({ type: REMOVE_SELECTED_CELLS });
		dispatchSpreadsheetAction({
			type: TOGGLE_COLUMN_TYPE_MODAL,
			columnTypeModalOpen: true,
			column: columns.find((col) => col.id === dataKey),
		});
	}
	return (
		<React.Fragment key={dataKey}>
			<div
				className={
					uniqueColumnIDs.includes(dataKey) ? (
						'ReactVirtualized__Table__headerTruncatedText column-header-selected'
					) : (
						'ReactVirtualized__Table__headerTruncatedText'
					)
				}
				style={{
					userSelect: 'none',
				}}
				onClick={(e) => {
					if (columnIndex < columns.length) {
						if (contextMenuOpen) {
							dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
						}
						dispatchSpreadsheetAction({
							type: SELECT_COLUMN,
							columnID: dataKey,
							columnIndex,
							selectionActive: e.ctrlKey || e.shiftKey || e.metaKey,
						});
					}
				}}
				onDoubleClick={openModal}
				onContextMenu={(e) => {
					if (columnIndex < columns.length) {
						e.preventDefault();
						dispatchSpreadsheetAction({
							type: SELECT_COLUMN,
							columnID: dataKey,
							columnIndex,
							selectionActive: e.ctrlKey || e.shiftKey || e.metaKey,
						});
						dispatchSpreadsheetAction({
							type: OPEN_CONTEXT_MENU,
							colName: label,
							contextMenuType: 'column',
							contextMenuPosition: { left: e.pageX, top: e.pageY },
						});
					}
				}}
			>
				{label}
			</div>
			<Draggable
				axis="x"
				defaultClassName="DragHandle"
				defaultClassNameDragging="DragHandleActive"
				onDrag={(event, { deltaX }) =>
					resizeColumn({
						dataKey: dataKey,
						deltaX,
					})}
				position={{ x: 0 }}
				zIndex={999}
			>
				<span
					style={{ userSelect: 'none' }}
					className={uniqueColumnIDs.includes(dataKey) ? 'DragHandleIcon-selected' : 'DragHandleIcon'}
				>
					⋮
				</span>
			</Draggable>
		</React.Fragment>
	);
}
