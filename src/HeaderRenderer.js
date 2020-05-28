/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import {
	useSpreadsheetState,
	useSpreadsheetDispatch,
	useSelectDispatch,
	useRowsState,
	useRowsDispatch,
	useSelectState,
	useColumnWidthDispatch,
} from './context/SpreadsheetProvider';
import Draggable from 'react-draggable';
import {
	CREATE_COLUMNS,
	CLOSE_CONTEXT_MENU,
	OPEN_CONTEXT_MENU,
	REMOVE_SELECTED_CELLS,
	SELECT_COLUMN,
	TOGGLE_COLUMN_TYPE_MODAL,
} from './constants';

export default React.memo(function HeaderRenderer({ dataKey, label, units, columnIndex }) {
	const { contextMenuOpen } = useSpreadsheetState();
	const { uniqueColumnIDs } = useSelectState();
	const { columns, rows } = useRowsState();
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const dispatchSelectAction = useSelectDispatch();
	const dispatchRowsAction = useRowsDispatch();
	const dispatchColumnWidthAction = useColumnWidthDispatch();

	function createNewColumns(columnCount) {
		dispatchRowsAction({ type: CREATE_COLUMNS, columnCount });
	}
	function openModal(e) {
		if (!dataKey) {
			// TODO: Fix these seemingly magic numbers
			if (columnIndex >= columns.length - 1) {
				createNewColumns(columnIndex + 2 - columns.length);
				return;
			}
		}
		dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
		dispatchSpreadsheetAction({
			type: TOGGLE_COLUMN_TYPE_MODAL,
			columnTypeModalOpen: true,
			column: columns.find((col) => col.id === dataKey),
		});
	}

	const resizeColumn = ({ dataKey, deltaX }) => {
		dispatchColumnWidthAction({ type: 'RESIZE_COLUMN', dataKey, deltaX });
	};
	// setWidths((prevWidths) => {
	//   // for empty columns
	//   if (!dataKey) {
	//     return prevWidths;
	//   }
	//   return {
	//     ...prevWidths,
	//     // don't allow columns to shrink below 50px
	//     [dataKey]: Math.max(prevWidths[dataKey] + deltaX, 50),
	//   };
	// });

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
						dispatchSelectAction({
							type: SELECT_COLUMN,
							rows: rows,
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
						dispatchSelectAction({
							type: SELECT_COLUMN,
							rows: rows,
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
				{units ? ` (${units})` : ''}
			</div>
			<Draggable
				axis="x"
				defaultClassName="DragHandle"
				defaultClassNameDragging="DragHandleActive"
				onDrag={(event, { deltaX }) => {
					if (!dataKey) return;
					return resizeColumn({
						dataKey: dataKey,
						deltaX,
					});
				}}
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
});
