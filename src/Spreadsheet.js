/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { pingCloudFunctions } from './analysis-output/Analysis';
import {
	useSpreadsheetState,
	useSpreadsheetDispatch,
	useSelectDispatch,
	useRowsState,
	useRowsDispatch,
	useSelectState,
} from './context/SpreadsheetProvider';
import ContextMenu from './ContextMenu';
import Analysis from './analysis-output/Analysis';
import BarChartModal from './Modals/ModalBarChart';
import ColumnTypeModal from './Modals/ModalColumnType';
import DistributionModal from './Modals/ModalDistribution';
import FilterModal from './Modals/ModalFilter';
import AnalysisModal from './Modals/ModalFitYX';
import { selectRowAndColumnIDs } from './context/helpers';
// import TestCounter from './TestCounter';
import {
	ACTIVATE_CELL,
	ADD_CURRENT_SELECTION_TO_CELL_SELECTIONS,
	CLOSE_CONTEXT_MENU,
	COPY_VALUES,
	CREATE_COLUMNS,
	CREATE_ROWS,
	DELETE_VALUES,
	PASTE_VALUES,
	REMOVE_SELECTED_CELLS,
	SELECT_ALL_CELLS,
	SELECT_BLOCK_OF_CELLS,
	TRANSLATE_SELECTED_CELL,
	FORMULA,
} from './constants';
import TableView from './TableView';

export const checkIfValidNumber = (str) => {
	if (str.match(/^-?\d*\.?\d*$/)) {
		return false;
	}
	return str;
};

export default function Spreadsheet() {
	const {
		analysisModalOpen,
		barChartModalOpen,
		distributionModalOpen,
		filterModalOpen,
		selectedColumn,
	} = useSpreadsheetState();
	const { rows, columns } = useRowsState();
	const { cellSelectionRanges, activeCell } = useSelectState();
	const dispatchSelectAction = useSelectDispatch();
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const dispatchRowsAction = useRowsDispatch();
	const [ popup, setPopup ] = useState([]);

	useEffect(() => {
		// Activate cell top leftmost cell on first load
		dispatchSelectAction({ type: ACTIVATE_CELL, row: 0, column: 1 });
		// Wake up cloud functions
		pingCloudFunctions();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// When a new column is created, set the default width to 100px;

	async function paste() {
		// safari doesn't have navigator.clipboard
		if (!navigator.clipboard) {
			console.log('navigator.clipboard not supported by safari/edge');
			return;
		}
		// TODO: Fix this bug properly
		if (!cellSelectionRanges[0]) {
			console.log('no cell selection range');
			return;
		}
		const copiedValues = await navigator.clipboard.readText();
		const copiedValuesStringified = JSON.stringify(copiedValues).replace(/(?:\\[rn]|[\r\n])/g, '\\n');
		const copiedValuesRows = JSON.parse(copiedValuesStringified).split('\n');
		const copiedValues2dArray = copiedValuesRows.map((clipRow) => clipRow.split('\t'));
		const copiedValues2dArrayDimensions = { height: copiedValues2dArray.length, width: copiedValues2dArray[0].length };
		const { top, left } = cellSelectionRanges[0];
		const { height, width } = copiedValues2dArrayDimensions;
		const numberOfColumnsRequired = left - 1 + width - columns.length;
		const numberOfRowsRequired = top + height - rows.length;
		if (numberOfRowsRequired > 0) {
			dispatchRowsAction({ type: CREATE_ROWS, rowCount: numberOfRowsRequired });
		}
		if (numberOfColumnsRequired > 0) {
			dispatchRowsAction({ type: CREATE_COLUMNS, columnCount: numberOfColumnsRequired });
		}
		const { selectedColumnIDs, selectedRowIDs } = selectRowAndColumnIDs(
			top,
			left,
			top + height - 1,
			left + width - 1,
			columns,
			rows,
		);

		const uniqueColumnIDs = selectedColumnIDs;
		const uniqueRowIDs = selectedRowIDs;
		const newCellSelectionRanges = [
			{
				top: top,
				left: left,
				bottom: top + height - 1,
				right: left + width - 1,
			},
		];

		dispatchRowsAction({
			type: PASTE_VALUES,
			copiedValues2dArray,
			selectedColumnIDs,
			selectedRowIDs,
		});
		dispatchSelectAction({
			type: SELECT_BLOCK_OF_CELLS,
			uniqueColumnIDs,
			uniqueRowIDs,
			cellSelectionRanges: newCellSelectionRanges,
		});
	}

	useEffect(() => {
		function onKeyDown(event) {
			if (activeCell || barChartModalOpen || distributionModalOpen || analysisModalOpen || filterModalOpen) {
				return;
			}
			if (!activeCell && cellSelectionRanges.length === 0) {
				return;
			}
			const columnIndex = activeCell ? activeCell.column - 1 : cellSelectionRanges[0].left - 1;
			const rowIndex = activeCell ? activeCell.row : cellSelectionRanges[0].top;

			if (event.metaKey || event.ctrlKey) {
				// prevent cell input if holding ctrl/meta
				if (event.key === 'c') {
					dispatchRowsAction({ type: COPY_VALUES, cellSelectionRanges });
					return;
				} else if (event.key === 'v') {
					paste();
					return;
				} else if (event.key === 'a') {
					event.preventDefault();
					dispatchSelectAction({ type: SELECT_ALL_CELLS, rows, columns });
					return;
				}
				return;
			}
			if (event.key.length === 1) {
				if (rowIndex + 1 > rows.length) {
					dispatchRowsAction({ type: CREATE_ROWS, rowCount: rows });
				}
				if (columns[columnIndex].type !== FORMULA) {
					dispatchSelectAction({
						type: ACTIVATE_CELL,
						row: rowIndex,
						column: columnIndex + 1,
						newInputCellValue: event.key,
					});
				}
			} else {
				switch (event.key) {
					case 'Backspace':
						dispatchRowsAction({ type: DELETE_VALUES, cellSelectionRanges });
						break;
					case 'Escape':
						dispatchSpreadsheetAction({ type: REMOVE_SELECTED_CELLS });
						break;
					case 'ArrowDown':
					case 'ArrowUp':
					case 'ArrowLeft':
					case 'ArrowRight':
						event.preventDefault();
						const { row, column } = cursorKeyToRowColMapper[event.key](
							rowIndex,
							columnIndex + 1,
							rows.length,
							columns.length,
						);
						dispatchSelectAction({
							type: TRANSLATE_SELECTED_CELL,
							rowIndex: row,
							columnIndex: column,
							rows,
							columns,
						});
						break;
					default:
						break;
				}
			}
		}

		document.addEventListener('keydown', onKeyDown);
		return () => {
			document.removeEventListener('keydown', onKeyDown);
		};
	});

	return (
		// Height 100% necessary for autosizer to work
		<div style={{ height: '100%', width: '100%' }}>
			<Analysis popup={popup} setPopup={setPopup} />
			<ContextMenu paste={paste} />
			{selectedColumn && <ColumnTypeModal selectedColumn={selectedColumn} />}
			{barChartModalOpen && <BarChartModal setPopup={setPopup} />}
			{distributionModalOpen && <DistributionModal setPopup={setPopup} />}
			{analysisModalOpen && <AnalysisModal setPopup={setPopup} />}
			{filterModalOpen && <FilterModal selectedColumn={selectedColumn} />}
			<div
				style={{ height: '100%', display: 'flex' }}
				// onKeyDown={onKeyDown}
				onMouseDown={(e) => {
					e.preventDefault();
					return dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
				}}
				onMouseUp={(e) => {
					e.preventDefault();
					return dispatchSelectAction({ type: ADD_CURRENT_SELECTION_TO_CELL_SELECTIONS });
				}}
			>
				<TableView />
			</div>
		</div>
	);
}

export const cursorKeyToRowColMapper = {
	ArrowUp: function(row, column) {
		// rows should never go less than index 0 (top row header)
		return { row: Math.max(row - 1, 0), column };
	},
	ArrowDown: function(row, column, numberOfRows) {
		return { row: Math.min(row + 1, numberOfRows - 1), column };
	},
	ArrowLeft: function(row, column) {
		// Column should be minimum of 1 due to side row header
		return { row, column: Math.max(column - 1, 1) };
	},
	ArrowRight: function(row, column, _, numberOfColumns) {
		return { row, column: Math.min(column + 1, numberOfColumns) };
	},
	Enter: function(row, column, numberOfRows) {
		return { row: Math.min(row + 1, numberOfRows), column };
	},
	Tab: function(row, column, numberOfRows, numberOfColumns, shiftKey) {
		if (shiftKey) {
			if (column !== 1) return { row, column: column - 1 };
			else if (column === 1 && row === 0) return { row: numberOfRows - 1, column: numberOfColumns };
			else if (column === 1 && row !== 0) return { row: row - 1, column: numberOfColumns };
		} else {
			if (column < numberOfColumns) return { row, column: column + 1 };
			else if (column === numberOfColumns && row === numberOfRows - 1) return { row: 0, column: 1 };
			else if (column === numberOfColumns) return { row: row + 1, column: 1 };
		}
	},
};
