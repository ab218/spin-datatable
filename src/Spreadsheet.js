import React, { useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import AnalysisModal from './ModalFitXY';
import ActiveCell from './ActiveCell';
import ColResizer from './ColResizer';
import ContextMenu from './ContextMenu';
import DistributionModal from './ModalDistribution';
import FilterModal from './ModalFilter';
import ColumnTypeModal from './ModalColumnType';
import AnalysisButtons from './AnalysisButtons';
import Row from './Row';
import { VariableSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { SelectedCell, NormalCell } from './Cell';
import {
	ACTIVATE_CELL,
	ADD_CURRENT_SELECTION_TO_CELL_SELECTIONS,
	CLOSE_CONTEXT_MENU,
	CREATE_COLUMNS,
	CREATE_ROWS,
	MODIFY_CURRENT_SELECTION_CELL_RANGE,
	SELECT_CELL,
	OPEN_CONTEXT_MENU,
	PASTE_VALUES,
} from './constants';

// function FormulaBar() {
//   return (
//     <div style={{display: 'flex', height: '30px'}}>
//       <div style={{minWidth: '80px', margin: 'auto', fontStyle: 'italic'}}>Fx</div>
//       <input style={{width: '100%', fontSize: '1.2em', borderLeft: '0.1px solid lightgray', borderBottom: 'none', borderTop: 'none', borderRight: 'none'}} />
//     </div>
//   )
// }

export const checkIfValidNumber = (str) => {
	if (str.match(/^-?\d*\.?\d*$/)) {
		return false;
	}
	return str;
};

export function formatForNumberColumn(cellValue, column) {
	if (cellValue && column.type === 'Number') {
		return isNaN(cellValue);
	}
}

function BlankRow({ cellCount }) {
	return (
		<tr>
			{Array(cellCount)
				.fill(undefined)
				.map((_, columnIndex) => <td style={{ backgroundColor: '#eee' }} key={'blankcol' + columnIndex} />)}
		</tr>
	);
}

function BlankClickableRow({
	activeCell,
	cellCount,
	changeActiveCell,
	columns,
	createNewColumns,
	createNewRows,
	finishCurrentSelectionRange,
	handleContextMenu,
	isSelectedCell,
	modifyCellSelectionRange,
	numberOfRows,
	paste,
	rowIndex,
	row,
	rows,
	selectCell,
}) {
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const { contextMenuOpen } = useSpreadsheetState();
	return (
		<tr>
			{Array(cellCount).fill(undefined).map((_, columnIndex) => {
				const column = columns[columnIndex - 1];
				const isFormulaColumn = column && column.formula;
				if (activeCell && activeCell.column > 0 && activeCell.row === rowIndex && activeCell.column === columnIndex) {
					return (
						<ActiveCell
							key={`row${rowIndex}col${columnIndex}`}
							changeActiveCell={changeActiveCell}
							columnIndex={columnIndex}
							column={column}
							columns={columns}
							createNewColumns={createNewColumns}
							createNewRows={createNewRows}
							handleContextMenu={handleContextMenu}
							numberOfRows={numberOfRows}
							rowIndex={rowIndex}
							rows={rows}
						/>
					);
				} else if (column && isSelectedCell(rowIndex, columnIndex)) {
					return (
						<SelectedCell
							key={`Row${rowIndex}Col${columnIndex}`}
							isFormulaColumn={isFormulaColumn}
							changeActiveCell={changeActiveCell}
							column={column}
							columnIndex={columnIndex}
							columns={columns}
							createNewColumns={createNewColumns}
							createNewRows={createNewRows}
							finishCurrentSelectionRange={finishCurrentSelectionRange}
							handleContextMenu={handleContextMenu}
							modifyCellSelectionRange={modifyCellSelectionRange}
							numberOfRows={numberOfRows}
							paste={paste}
							row={row}
							rows={rows}
							rowIndex={rowIndex}
						/>
					);
				} else if (!column) {
					return <td style={{ backgroundColor: '#eee' }} key={`blank_cell${rowIndex}_${columnIndex}`} />;
				}
				return (
					<td
						onMouseDown={(event) => {
							event.preventDefault();
							if (contextMenuOpen) {
								dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
							}
							selectCell(rowIndex, columnIndex, event.ctrlKey || event.shiftKey || event.metaKey);
						}}
						onMouseEnter={(event) => {
							if (typeof event.buttons === 'number' && event.buttons > 0) {
								modifyCellSelectionRange(rowIndex, columnIndex, true);
							}
						}}
						onMouseUp={finishCurrentSelectionRange}
						key={`blank_cell${rowIndex}_${columnIndex}`}
					/>
				);
			})}
		</tr>
	);
}

function Spreadsheet({ eventBus }) {
	const {
		activeCell,
		allPhysicalColumns,
		analysisModalOpen,
		columnPositions,
		columns,
		cellSelectionRanges,
		distributionModalOpen,
		currentCellSelectionRange,
		filterModalOpen,
		groupByColumnID,
		groupedColumns,
		layout,
		physicalRows,
		physicalRowPositions,
		rowPositions,
		rows,
		selectedColumn,
		selectedRowIDs,
		tableView,
	} = useSpreadsheetState();
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();

	async function pingCloudFunctions() {
		const linearRegression = 'https://us-central1-optimum-essence-210921.cloudfunctions.net/statsmodels';
		await axios.post(
			linearRegression,
			{ ping: 'ping' },
			{
				crossDomain: true,
			},
		);

		const gcloud = 'https://us-central1-optimum-essence-210921.cloudfunctions.net/distribution';
		await axios.post(
			gcloud,
			{ ping: 'ping' },
			{
				crossDomain: true,
			},
		);
	}

	useEffect(() => {
		// Activate cell top leftmost cell on first load
		dispatchSpreadsheetAction({ type: ACTIVATE_CELL, row: 0, column: 1 });
		// Wake up cloud functions
		pingCloudFunctions();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	function isSelectedCell(row, column) {
		function withinRange(value) {
			const { top, right, bottom, left } = value;
			return row >= top && row <= bottom && column >= left && column <= right;
		}
		const withinASelectedRange = cellSelectionRanges.some(withinRange);
		return withinASelectedRange || (currentCellSelectionRange && withinRange(currentCellSelectionRange));
	}

	const rowMap = {};
	for (const id in rowPositions) {
		rowMap[rowPositions[id]] = id;
	}

	// Check if object is empty
	const rowCount = Object.keys(rowMap).length !== 0 ? Math.max(...Object.keys(rowMap)) + 1 : 0;
	// const visibleRowCount = Math.max(rowCount, 35); // 50 rows should be enough to fill the screen
	const rowIDs = Array(rowCount).fill(undefined).map((_, index) => {
		return rowMap[index];
	});
	// const groupedRowMap =
	// 	groupedColumns &&
	// 	Object.entries(physicalRowPositions).reduce((acc, [ id, position ]) => {
	// 		return { ...acc, [position]: id };
	// 	}, {});
	// const groupedRowCount = groupedRowMap ? Math.max(...Object.keys(groupedRowMap)) + 1 : 0;
	// const groupedVisibleRowCount = Math.max(groupedRowCount, 20);
	// const groupedRowIDs =
	// 	groupedRowCount !== -Infinity &&
	// 	Array(groupedRowCount).fill(undefined).map((_, index) => {
	// 		return groupedRowMap[index];
	// 	});

	// We add one more column header as the capstone for the column of row headers
	const visibleColumnCount = Math.max(26, columns.length);
	const headers = Array(visibleColumnCount)
		.fill(undefined)
		.map((_, index) => (
			<ColResizer
				columns={columns}
				createNewColumns={createNewColumns}
				borderRight={tableView && (index === 0 || index === 5) && true}
				columnIndex={index + 1}
				key={index}
				column={columns[index]}
			/>
		));
	// const spreadsheetHeaders = Array(26)
	// 	.fill(undefined)
	// 	.map((_, index) => (
	// 		<ColResizer
	// 			columns={columns}
	// 			createNewColumns={createNewColumns}
	// 			borderRight={tableView && (index === 0 || index === 5) && true}
	// 			columnIndex={index + 1}
	// 			key={index}
	// 			column={allPhysicalColumns && allPhysicalColumns[index]}
	// 		/>
	// 	));

	// const visibleRows = Array(visibleRowCount).fill(undefined).map((_, index) => {
	// 	if (rowIDs[index]) {
	// 		return (
	// 			<Row
	// 				selectedRow={selectedRowIDs && selectedRowIDs.includes(rowIDs[index])}
	// 				key={'Row' + index}
	// 				activeCell={activeCell}
	// 				cellCount={visibleColumnCount + 1}
	// 				changeActiveCell={changeActiveCell}
	// 				columnPositions={columnPositions}
	// 				columns={columns}
	// 				createNewColumns={createNewColumns}
	// 				createNewRows={createNewRows}
	// 				finishCurrentSelectionRange={finishCurrentSelectionRange}
	// 				handleContextMenu={handleContextMenu}
	// 				isSelectedCell={isSelectedCell}
	// 				modifyCellSelectionRange={modifyCellSelectionRange}
	// 				numberOfRows={rowCount}
	// 				paste={paste}
	// 				row={rows.find(({ id }) => id === rowIDs[index])}
	// 				rowIDs={rowIDs}
	// 				rowIndex={index}
	// 				rows={index - rowCount + 1}
	// 				selectCell={selectCell}
	// 			/>
	// 		);
	// 	} else if (rowIDs[index - 1]) {
	// 		return (
	// 			<BlankClickableRow
	// 				key={'Row' + index}
	// 				cellCount={visibleColumnCount + 1}
	// 				activeCell={activeCell}
	// 				handleContextMenu={handleContextMenu}
	// 				changeActiveCell={changeActiveCell}
	// 				columns={columns}
	// 				createNewRows={createNewRows}
	// 				createNewColumns={createNewColumns}
	// 				finishCurrentSelectionRange={finishCurrentSelectionRange}
	// 				isSelectedCell={isSelectedCell}
	// 				modifyCellSelectionRange={modifyCellSelectionRange}
	// 				numberOfRows={rowCount}
	// 				paste={paste}
	// 				rowIndex={index}
	// 				rows={index - rowCount + 1}
	// 				selectCell={selectCell}
	// 			/>
	// 		);
	// 	} else {
	// 		return <BlankRow key={'BlankRow' + index} cellCount={visibleColumnCount + 1} />;
	// 	}
	// });

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
			createNewRows(numberOfRowsRequired);
		}
		if (numberOfColumnsRequired > 0) {
			createNewColumns(numberOfColumnsRequired);
		}
		dispatchSpreadsheetAction({
			type: PASTE_VALUES,
			copiedValues2dArray,
			top,
			left,
			height,
			width,
		});
	}

	function createNewRows(rowCount) {
		dispatchSpreadsheetAction({ type: CREATE_ROWS, rowCount });
	}

	function createNewColumns(columnCount) {
		dispatchSpreadsheetAction({ type: CREATE_COLUMNS, columnCount });
	}

	function changeActiveCell(row, column, selectionActive) {
		dispatchSpreadsheetAction({ type: ACTIVATE_CELL, row, column, selectionActive });
	}

	function selectCell(row, column, selectionActive) {
		dispatchSpreadsheetAction({ type: SELECT_CELL, row, column, selectionActive });
	}

	function modifyCellSelectionRange(row, col) {
		dispatchSpreadsheetAction({ type: MODIFY_CURRENT_SELECTION_CELL_RANGE, endRangeRow: row, endRangeColumn: col });
	}

	function finishCurrentSelectionRange() {
		dispatchSpreadsheetAction({ type: ADD_CURRENT_SELECTION_TO_CELL_SELECTIONS });
	}

	// const visibleSpreadsheetRows = Array(groupedVisibleRowCount).fill(undefined).map((_, index) => {
	// 	if (groupedRowIDs[index]) {
	// 		return (
	// 			<Row
	// 				key={'Row' + index}
	// 				activeCell={activeCell}
	// 				cellCount={26 + 1}
	// 				changeActiveCell={changeActiveCell}
	// 				columns={allPhysicalColumns}
	// 				createNewColumns={createNewColumns}
	// 				createNewRows={createNewRows}
	// 				finishCurrentSelectionRange={finishCurrentSelectionRange}
	// 				handleContextMenu={handleContextMenu}
	// 				isSelectedCell={isSelectedCell}
	// 				modifyCellSelectionRange={modifyCellSelectionRange}
	// 				numberOfRows={groupedRowCount}
	// 				row={physicalRows.find(({ id }) => id === groupedRowIDs[index])}
	// 				rowIDs={groupedRowIDs}
	// 				rowIndex={index}
	// 				rows={index - groupedRowCount + 1}
	// 				selectCell={selectCell}
	// 				paste={paste}
	// 			/>
	// 		);
	// 	} else if (groupedRowIDs[index - 1]) {
	// 		return (
	// 			<BlankClickableRow
	// 				key={'Row' + index}
	// 				cellCount={26 + 1}
	// 				activeCell={activeCell}
	// 				changeActiveCell={changeActiveCell}
	// 				columns={allPhysicalColumns}
	// 				createNewRows={createNewRows}
	// 				createNewColumns={createNewColumns}
	// 				finishCurrentSelectionRange={finishCurrentSelectionRange}
	// 				handleContextMenu={handleContextMenu}
	// 				isSelectedCell={isSelectedCell}
	// 				modifyCellSelectionRange={modifyCellSelectionRange}
	// 				numberOfRows={groupedRowCount}
	// 				paste={paste}
	// 				rowIndex={index}
	// 				rows={index - groupedRowCount + 1}
	// 				selectCell={selectCell}
	// 			/>
	// 		);
	// 	} else {
	// 		return <BlankRow key={'BlankRow' + index} cellCount={26 + 1} />;
	// 	}
	// });

	function handleContextMenu(e) {
		e.preventDefault();
		dispatchSpreadsheetAction({ type: OPEN_CONTEXT_MENU, contextMenuPosition: { left: e.pageX, top: e.pageY } });
	}

	function getGroupedByColumnIDLabel(id) {
		const found = columns.find((col) => col.id === id);
		return found.label;
	}

	function getKeyByValue(object, value) {
		return Object.keys(object).find((key) => object[key] === value);
	}

	function newSelectCell(e, rowIndex, columnIndex) {
		console.log(rowIndex, columnIndex);
		selectCell(rowIndex, columnIndex, e.ctrlKey || e.shiftKey || e.metaKey);
	}

	function RowHeader({ rowIndex, style }) {
		return (
			<div className={'row-number-cell'} style={{ ...style }}>
				{rowIndex + 1}
			</div>
		);
	}

	const Cell = ({ rowIndex, columnIndex, style }) => {
		const columnIndexOffsetOne = columnIndex - 1;
		const columnId = getKeyByValue(columnPositions, columnIndexOffsetOne);
		const rowId = rowIDs[rowIndex];
		const foundRow = rows[rowPositions[rowId]];

		if (columnIndexOffsetOne >= columns.length) {
			return (
				<div
					style={{ ...style, backgroundColor: '#eee' }}
					key={`row${rowIndex}col${columnIndex}`}
					className={'virtualized-cell'}
					onMouseDown={(e) => {
						e.preventDefault();
						// if (contextMenuOpen) {
						//   dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
						// }
						selectCell(rowIndex, columnIndex);
					}}
				/>
			);
		}
		// const rowId = getKeyByValue(rowPositions, rowIndex);
		// const foundRow = rows.find((row) => row.id === rowId);

		console.log('rowId: ', rowId, 'foundRow: ', foundRow);

		if (columnIndex === 0) {
			return <RowHeader rowIndex={rowIndex} style={style} />;
		}
		if (activeCell && activeCell.row === rowIndex && activeCell.column === columnIndexOffsetOne) {
			return (
				<ActiveCell
					handleContextMenu={handleContextMenu}
					key={`row${rowIndex}col${columnIndex}`}
					changeActiveCell={changeActiveCell}
					column={columns[columnIndexOffsetOne]}
					columnIndex={columnIndexOffsetOne}
					columns={columns}
					createNewColumns={createNewColumns}
					createNewRows={createNewRows}
					numberOfRows={rows.length}
					style={style}
					row={foundRow}
					value={foundRow[columnId]}
				/>
			);
		}
		if (isSelectedCell(rowIndex, columnIndex)) {
			return (
				<SelectedCell
					key={`Row${rowIndex}Col${columnIndex}`}
					// isFormulaColumn={isFormulaColumn}
					changeActiveCell={changeActiveCell}
					column={columns[columnIndexOffsetOne]}
					columnIndex={columnIndexOffsetOne}
					columns={columns}
					createNewColumns={createNewColumns}
					createNewRows={createNewRows}
					finishCurrentSelectionRange={finishCurrentSelectionRange}
					handleContextMenu={handleContextMenu}
					modifyCellSelectionRange={modifyCellSelectionRange}
					numberOfRows={rows.length}
					paste={paste}
					row={foundRow}
					rows={rows}
					rowIndex={rowIndex}
					style={style}
				/>
			);
		}

		return (
			<NormalCell
				key={`Row${rowIndex}Col${columnIndex}`}
				changeActiveCell={changeActiveCell}
				column={columns[columnIndexOffsetOne]}
				columnIndex={columnIndex}
				finishCurrentSelectionRange={finishCurrentSelectionRange}
				modifyCellSelectionRange={modifyCellSelectionRange}
				row={foundRow}
				rowIndex={rowIndex}
				selectCell={selectCell}
				cellValue={foundRow[columnId]}
				style={style}
			/>
			// <div onClick={(e) => newSelectCell(e, rowIndex, columnIndex)} className={'virtualized-cell'} style={{ ...style }}>
			// 	{foundRow[columnId]}
			// </div>
		);
	};

	const columnWidths = new Array(26).fill(true).map((_, i) => {
		if (i === 0) {
			return 45;
		}
		return 80;
	});
	const rowHeights = new Array(rows.length).fill(true).map(() => 30);
	const gridRef = React.createRef();

	return (
		// Height 100% necessary for autosizer to work
		<div style={{ height: '100%' }}>
			<ContextMenu paste={paste} />
			{selectedColumn && <ColumnTypeModal selectedColumn={selectedColumn} />}
			{distributionModalOpen && <DistributionModal />}
			{analysisModalOpen && <AnalysisModal />}
			{filterModalOpen && <FilterModal selectedColumn={selectedColumn} />}
			<span style={{ display: 'flex' }}>{headers}</span>
			<AutoSizer>
				{({ height, width }) => (
					<Grid
						ref={gridRef}
						columnCount={26}
						columnWidth={(index) => columnWidths[index]}
						height={height}
						rowCount={rows.length}
						rowHeight={(index) => rowHeights[index]}
						width={width}
					>
						{Cell}
					</Grid>
				)}
			</AutoSizer>
			<AnalysisButtons />
		</div>
	);
}

export default Spreadsheet;
