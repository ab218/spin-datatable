import React, { useCallback, useEffect, useState } from 'react';
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
	UNDO,
	REDO,
	FORMULA,
} from './constants';
import TableView from './MainTable';
import Sidebar from './Sidebar';
import useEventListener from './useEventListener';

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
		// Wake up cloud functions
		pingCloudFunctions();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// When a new column is created, set the default width to 100px;

	const paste = useCallback(
		async () => {
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
			// stringify to get character codes for tabs and carriage returns
			const copiedValuesStringified = JSON.stringify(copiedValues);
			// replace \r and \r\n with \n
			const stringifiedValuesReplaced = copiedValuesStringified.replace(/(?:\\[rn]|[\r\n]+)+/g, '\\n');
			const copiedValuesRows = JSON.parse(stringifiedValuesReplaced).split('\n');
			const copiedValues2dArray = copiedValuesRows.map((clipRow) => clipRow.split('\t'));
			const copiedValues2dArrayDimensions = {
				height: copiedValues2dArray.length,
				width: copiedValues2dArray[0].length,
			};
			const { top, left } = cellSelectionRanges[0];
			// quick patch to prevent major bug
			// if (top === rows.length) return;
			const { height, width } = copiedValues2dArrayDimensions;
			const numberOfColumnsRequired = left + width - columns.length;
			const numberOfRowsRequired = top + height - rows.length;
			if (numberOfRowsRequired > 0) {
				dispatchRowsAction({ type: CREATE_ROWS, rowCount: numberOfRowsRequired });
			}
			if (numberOfColumnsRequired > 0) {
				dispatchRowsAction({ type: CREATE_COLUMNS, columnCount: numberOfColumnsRequired });
			}
			// const { selectedColumnIDs, selectedRowIDs } = selectRowAndColumnIDs(
			// 	top,
			// 	left,
			// 	top + height - 1,
			// 	left + width - 1,
			// 	columns,
			// 	rows,
			// );

			dispatchRowsAction({
				type: PASTE_VALUES,
				copiedValues2dArray,
				top,
				left,
				height,
				width,
			});

			const newCellSelectionRanges = [
				{
					top: top,
					left: left,
					bottom: top + height - 1,
					right: left + width - 1,
				},
			];
			dispatchSelectAction({
				type: SELECT_BLOCK_OF_CELLS,
				cellSelectionRanges: newCellSelectionRanges,
			});
		},
		[ cellSelectionRanges, columns, dispatchRowsAction, dispatchSelectAction, rows ],
	);

	const onKeyDown = useCallback(
		(event) => {
			const { key, shiftKey, metaKey, ctrlKey } = event;
			if (
				activeCell ||
				barChartModalOpen ||
				distributionModalOpen ||
				analysisModalOpen ||
				filterModalOpen ||
				selectedColumn
			) {
				return;
			}
			let rowIndex = 0;
			let columnIndex = 0;
			if (cellSelectionRanges.length !== 0) {
				columnIndex = cellSelectionRanges[0].left;
				rowIndex = cellSelectionRanges[0].top;
			}

			if (metaKey || ctrlKey) {
				// prevent cell input if holding ctrl/meta
				switch (key) {
					case 'c':
						if (cellSelectionRanges.length === 0) return;
						dispatchRowsAction({ type: COPY_VALUES, cellSelectionRanges });
						return;
					case 'v':
						paste();
						return;
					case 'a':
						event.preventDefault();
						dispatchSelectAction({ type: SELECT_ALL_CELLS, rows, columns });
						return;
					case 'z':
						event.preventDefault();
						if (shiftKey) {
							dispatchRowsAction({ type: REDO });
							return;
						}
						dispatchRowsAction({ type: UNDO });
						return;
					default:
						break;
				}
			}
			if (cellSelectionRanges.length !== 0 && key.length === 1) {
				if (rowIndex + 1 > rows.length) {
					dispatchRowsAction({ type: CREATE_ROWS, rowCount: rows });
				}
				if (columns[columnIndex].type !== FORMULA) {
					dispatchSelectAction({
						type: ACTIVATE_CELL,
						row: rowIndex,
						column: columnIndex,
						newInputCellValue: key,
					});
				}
			} else {
				switch (key) {
					case 'Backspace':
						if (cellSelectionRanges.length === 0) return;
						dispatchRowsAction({ type: DELETE_VALUES, cellSelectionRanges });
						break;
					case 'Escape':
						dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
						break;
					case 'ArrowDown':
					case 'ArrowUp':
					case 'ArrowLeft':
					case 'ArrowRight':
						event.preventDefault();
						const { row, column } = cursorKeyToRowColMapper[key](
							rowIndex,
							columnIndex,
							rows.length - 1,
							columns.length - 1,
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
		},
		[
			activeCell,
			barChartModalOpen,
			distributionModalOpen,
			analysisModalOpen,
			filterModalOpen,
			selectedColumn,
			cellSelectionRanges,
			dispatchRowsAction,
			paste,
			dispatchSelectAction,
			rows,
			columns,
		],
	);

	useEventListener('keydown', onKeyDown);

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
				style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'space-between' }}
				onMouseDown={() => dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU })}
				onMouseUp={() => dispatchSelectAction({ type: ADD_CURRENT_SELECTION_TO_CELL_SELECTIONS })}
			>
				<div
					style={{
						width: '20vw',
						height: '100vh',
						zIndex: 10,
						backgroundColor: 'white',
						textAlign: 'left',
						position: 'sticky',
						top: 0,
						left: 0,
					}}
				>
					<Sidebar />
				</div>
				<div style={{ width: '80vw' }}>
					<TableView />
				</div>
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
		return { row: Math.min(row + 1, numberOfRows), column };
	},
	ArrowLeft: function(row, column) {
		// Column should be minimum of 1 due to side row header
		return { row, column: Math.max(column - 1, 0) };
	},
	ArrowRight: function(row, column, _, numberOfColumns) {
		return { row, column: Math.min(column + 1, numberOfColumns) };
	},
	Enter: function(row, column, numberOfRows) {
		return { row: Math.min(row + 1, numberOfRows), column };
	},
	Tab: function(row, column, numberOfRows, numberOfColumns, shiftKey) {
		if (shiftKey) {
			if (column !== 0) return { row, column: column - 1 };
			else if (column === 0 && row === 0) return { row: numberOfRows - 1, column: numberOfColumns - 1 };
			else if (column === 0 && row !== 0) return { row: row - 1, column: numberOfColumns - 1 };
		} else {
			if (column < numberOfColumns - 1) return { row, column: column + 1 };
			else if (column === numberOfColumns - 1 && row === numberOfRows - 1) return { row: 0, column: 0 };
			else if (column === numberOfColumns - 1) return { row: row + 1, column: 0 };
		}
	},
};
