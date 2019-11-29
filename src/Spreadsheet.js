/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import AnalysisModal from './ModalFitXY';
import ActiveCell from './ActiveCell';
// import ColResizer from './ColResizer';
import ContextMenu from './ContextMenu';
import DistributionModal from './ModalDistribution';
import FilterModal from './ModalFilter';
import ColumnTypeModal from './ModalColumnType';
import AnalysisButtons from './AnalysisButtons';
import HamburgerMenu from './HamburgerMenu';
import { Column, Table, AutoSizer } from 'react-virtualized';
import Draggable from 'react-draggable';
import { SelectedCell, NormalCell } from './Cell';
import {
	ACTIVATE_CELL,
	ADD_CURRENT_SELECTION_TO_CELL_SELECTIONS,
	// CLOSE_CONTEXT_MENU,
	CREATE_COLUMNS,
	CREATE_ROWS,
	MODIFY_CURRENT_SELECTION_CELL_RANGE,
	SELECT_CELL,
	OPEN_CONTEXT_MENU,
	PASTE_VALUES,
} from './constants';

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

// function BlankClickableRow({
// 	activeCell,
// 	cellCount,
// 	changeActiveCell,
// 	columns,
// 	createNewColumns,
// 	createNewRows,
// 	finishCurrentSelectionRange,
// 	handleContextMenu,
// 	isSelectedCell,
// 	modifyCellSelectionRange,
// 	numberOfRows,
// 	paste,
// 	rowIndex,
// 	row,
// 	rows,
// 	selectCell,
// }) {
// 	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
// 	const { contextMenuOpen } = useSpreadsheetState();
// 	return (
// 		<tr>
// 			{Array(cellCount).fill(undefined).map((_, columnIndex) => {
// 				const column = columns[columnIndex - 1];
// 				const isFormulaColumn = column && column.formula;
// 				if (activeCell && activeCell.column > 0 && activeCell.row === rowIndex && activeCell.column === columnIndex) {
// 					return (
// 						<ActiveCell
// 							key={`row${rowIndex}col${columnIndex}`}
// 							changeActiveCell={changeActiveCell}
// 							columnIndex={columnIndex}
// 							column={column}
// 							columns={columns}
// 							createNewColumns={createNewColumns}
// 							createNewRows={createNewRows}
// 							handleContextMenu={handleContextMenu}
// 							numberOfRows={numberOfRows}
// 							rowIndex={rowIndex}
// 							rows={rows}
// 						/>
// 					);
// 				} else if (column && isSelectedCell(rowIndex, columnIndex)) {
// 					return (
// 						<SelectedCell
// 							key={`Row${rowIndex}Col${columnIndex}`}
// 							isFormulaColumn={isFormulaColumn}
// 							changeActiveCell={changeActiveCell}
// 							column={column}
// 							columnIndex={columnIndex}
// 							columns={columns}
// 							createNewColumns={createNewColumns}
// 							createNewRows={createNewRows}
// 							finishCurrentSelectionRange={finishCurrentSelectionRange}
// 							handleContextMenu={handleContextMenu}
// 							modifyCellSelectionRange={modifyCellSelectionRange}
// 							numberOfRows={numberOfRows}
// 							paste={paste}
// 							row={row}
// 							rows={rows}
// 							rowIndex={rowIndex}
// 						/>
// 					);
// 				} else if (!column) {
// 					return <td style={{ backgroundColor: '#eee' }} key={`blank_cell${rowIndex}_${columnIndex}`} />;
// 				}
// 				return (
// 					<td
// 						onMouseDown={(event) => {
// 							event.preventDefault();
// 							if (contextMenuOpen) {
// 								dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
// 							}
// 							selectCell(rowIndex, columnIndex, event.ctrlKey || event.shiftKey || event.metaKey);
// 						}}
// 						onMouseEnter={(event) => {
// 							if (typeof event.buttons === 'number' && event.buttons > 0) {
// 								modifyCellSelectionRange(rowIndex, columnIndex, true);
// 							}
// 						}}
// 						onMouseUp={finishCurrentSelectionRange}
// 						key={`blank_cell${rowIndex}_${columnIndex}`}
// 					/>
// 				);
// 			})}
// 		</tr>
// 	);
// }

function Spreadsheet({ eventBus }) {
	const {
		activeCell,
		analysisModalOpen,
		columns,
		cellSelectionRanges,
		distributionModalOpen,
		currentCellSelectionRange,
		filterModalOpen,
		rowPositions,
		rows,
		selectedColumn,
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
	// const rowCount = Object.keys(rowMap).length !== 0 ? Math.max(...Object.keys(rowMap)) + 1 : 0;
	// const rowIDs = Array(rowCount).fill(undefined).map((_, index) => {
	// 	return rowMap[index];
	// });
	// const visibleColumnCount = Math.max(26, columns.length);
	// const headers = Array(visibleColumnCount)
	// 	.fill(undefined)
	// 	.map((_, index) => (
	// 		<ColResizer
	// 			columns={columns}
	// 			createNewColumns={createNewColumns}
	// 			borderRight={tableView && (index === 0 || index === 5) && true}
	// 			columnIndex={index + 1}
	// 			key={index}
	// 			column={columns[index]}
	// 		/>
	// 	));

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
		console.log(numberOfColumnsRequired);
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

	function handleContextMenu(e) {
		e.preventDefault();
		dispatchSpreadsheetAction({ type: OPEN_CONTEXT_MENU, contextMenuPosition: { left: e.pageX, top: e.pageY } });
	}

	const headerRenderer = ({ columnData: columnIndex, dataKey, disableSort, label, sortBy, sortDirection }) => {
		const onContextMenu = (e) => {
			e.preventDefault();
			dispatchSpreadsheetAction({
				type: OPEN_CONTEXT_MENU,
				colName: label,
				colHeaderContext: true,
				contextMenuPosition: { left: e.pageX, top: e.pageY },
			});
		};
		function openModal(e) {
			if (!dataKey) {
				if (columnIndex > columns.length) {
					createNewColumns(columnIndex + 1 - columns.length);
					return;
				}
			}
			dispatchSpreadsheetAction({ type: 'REMOVE_SELECTED_CELLS' });
			dispatchSpreadsheetAction({
				type: 'TOGGLE_COLUMN_TYPE_MODAL',
				columnTypeModalOpen: true,
				column: columns.find((col) => col.id === dataKey),
			});
		}
		return (
			<React.Fragment key={dataKey}>
				<div
					onDoubleClick={openModal}
					onContextMenu={onContextMenu}
					className="ReactVirtualized__Table__headerTruncatedText"
				>
					{label}
				</div>
				<Draggable
					axis="x"
					defaultClassName="DragHandle"
					defaultClassNameDragging="DragHandleActive"
					onDrag={(event, { deltaX }) =>
						resizeRow({
							dataKey,
							deltaX,
						})}
					position={{ x: 0 }}
					zIndex={999}
				>
					<span className="DragHandleIcon">⋮</span>
				</Draggable>
			</React.Fragment>
		);
	};

	useEffect(
		() => {
			// TODO: Fix this so it doesn't reset widths whenever a new column is created
			columns.forEach((col) => {
				setWidths((prevWidths) => {
					return { ...prevWidths, [col.id]: 100 };
				});
			});
		},
		[ columns ],
	);

	const [ widths, setWidths ] = useState(null);

	const resizeRow = ({ dataKey, deltaX }) =>
		setWidths((prevWidths) => {
			console.log(prevWidths);
			return {
				...prevWidths,
				[dataKey]: prevWidths[dataKey] + deltaX,
			};
		});

	function cellRenderer({ rowIndex, columnIndex, rowData, cellData, dataKey, columnData, isScrolling }) {
		if (activeCell && activeCell.row === rowIndex && activeCell.column === columnIndex) {
			return (
				<ActiveCell
					handleContextMenu={handleContextMenu}
					key={`row${rowIndex}col${columnIndex}`}
					changeActiveCell={changeActiveCell}
					columnIndex={columnIndex}
					columnId={dataKey}
					columns={columns}
					createNewColumns={createNewColumns}
					createNewRows={createNewRows}
					numberOfRows={rows.length}
					row={rowData}
					rowIndex={rowIndex}
					rows={rows}
					value={cellData}
				/>
			);
		} else if (isSelectedCell(rowIndex, columnIndex)) {
			return (
				<SelectedCell
					handleContextMenu={handleContextMenu}
					key={`Row${rowIndex}Col${columnIndex}`}
					changeActiveCell={changeActiveCell}
					columnId={dataKey}
					columns={columns}
					columnIndex={columnIndex}
					createNewColumns={createNewColumns}
					createNewRows={createNewRows}
					finishCurrentSelectionRange={finishCurrentSelectionRange}
					modifyCellSelectionRange={modifyCellSelectionRange}
					numberOfRows={rows.length}
					paste={paste}
					row={rowData}
					rows={rows}
					rowIndex={rowIndex}
					cellValue={cellData}
				/>
			);
		} else if (dataKey) {
			return (
				<NormalCell
					key={`Row${rowIndex}Col${columnIndex}`}
					changeActiveCell={changeActiveCell}
					columnIndex={columnIndex}
					finishCurrentSelectionRange={finishCurrentSelectionRange}
					modifyCellSelectionRange={modifyCellSelectionRange}
					row={rowData}
					rowIndex={rowIndex}
					selectCell={selectCell}
					cellValue={cellData}
				/>
			);
		} else {
			return (
				<div
					style={{ backgroundColor: '#eee', height: '100%', width: '100%' }}
					key={`row${rowIndex}col${columnIndex}`}
					onMouseDown={(e) => {
						e.preventDefault();
						// if (contextMenuOpen) {
						// 	dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
						// }
						selectCell(rowIndex, columnIndex);
					}}
				>
					&nbsp;
				</div>
			);
		}
	}

	function rowHeaders({ rowIndex }) {
		return <div className={'row-number-cell'}>{rowIndex + 1}</div>;
	}

	function renderColumns(totalColumnCount) {
		const colsContainer = [];
		for (let i = 0; i < totalColumnCount; i++) {
			const col = columns[i];
			if (col) {
				colsContainer.push(
					<Column
						key={i}
						headerRenderer={headerRenderer}
						dataKey={col.id}
						label={col.label}
						width={widths[col.id]}
						cellRenderer={cellRenderer}
						style={{
							border: '1px solid #ddd',
							borderLeft: i === 0 ? '1 px solid #ddd' : 'none',
							margin: 0,
						}}
					/>,
				);
			} else {
				colsContainer.push(
					<Column
						key={i}
						cellRenderer={cellRenderer}
						headerRenderer={headerRenderer}
						columnData={i}
						label={''}
						width={100}
						style={{ border: '1px solid #ddd', borderLeft: i === 0 ? '1 px solid #ddd' : 'none', margin: 0 }}
					/>,
				);
			}
		}
		return colsContainer;
	}

	function rowHeaderColumnHeaderRenderer() {
		return <HamburgerMenu />;
	}

	function sumOfColumnWidths(columns) {
		let total = 0;
		for (let i = 0; i < columns.length; i++) {
			total += columns[i];
		}
		return total;
	}

	return (
		// Height 100% necessary for autosizer to work
		<div style={{ height: '100%', width: '100%' }}>
			<ContextMenu paste={paste} />
			{selectedColumn && <ColumnTypeModal selectedColumn={selectedColumn} />}
			{distributionModalOpen && <DistributionModal />}
			{analysisModalOpen && <AnalysisModal />}
			{filterModalOpen && <FilterModal selectedColumn={selectedColumn} />}
			{widths && (
				<AutoSizer>
					{({ height, width }) => (
						<Table
							overscanRowCount={0}
							width={Math.max(width, 100 + sumOfColumnWidths(Object.values(widths)))}
							height={height}
							headerHeight={25}
							rowHeight={30}
							rowCount={rows.length}
							rowGetter={({ index }) => rows[index]}
							rowStyle={{ alignItems: 'stretch' }}
						>
							<Column
								width={40}
								label={''}
								dataKey={'abc123'}
								headerRenderer={rowHeaderColumnHeaderRenderer}
								cellRenderer={rowHeaders}
								style={{ margin: 0 }}
							/>
							{renderColumns(Math.max(columns.length, 18))}
						</Table>
					)}
				</AutoSizer>
			)}
			{/* <AnalysisButtons /> */}
		</div>
	);
}

export default Spreadsheet;
