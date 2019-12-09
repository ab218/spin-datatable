/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import AnalysisModal from './ModalFitXY';
import ActiveCell from './ActiveCell';
import ContextMenu from './ContextMenu';
import DistributionModal from './ModalDistribution';
import FilterModal from './ModalFilter';
import ColumnTypeModal from './ModalColumnType';
import AnalysisMenu from './AnalysisMenu';
import { Column, Table, AutoSizer } from 'react-virtualized';
import Draggable from 'react-draggable';
import { SelectedCell, NormalCell } from './Cell';
import {
	ACTIVATE_CELL,
	ADD_CURRENT_SELECTION_TO_CELL_SELECTIONS,
	ADD_CURRENT_SELECTION_TO_ROW_SELECTIONS,
	CLOSE_CONTEXT_MENU,
	COPY_VALUES,
	CREATE_COLUMNS,
	CREATE_ROWS,
	MODIFY_CURRENT_SELECTION_CELL_RANGE,
	SELECT_CELL,
	SELECT_COLUMN,
	SELECT_ROW,
	OPEN_CONTEXT_MENU,
	PASTE_VALUES,
	SELECT_ALL_CELLS,
	TOGGLE_COLUMN_TYPE_MODAL,
	REMOVE_SELECTED_CELLS,
	MODIFY_CURRENT_SELECTION_ROW_RANGE,
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

function Spreadsheet({ eventBus }) {
	const {
		activeCell,
		analysisModalOpen,
		columns,
		contextMenuOpen,
		cellSelectionRanges,
		distributionModalOpen,
		currentCellSelectionRange,
		filterModalOpen,
		rows,
		selectedColumn,
		selectedRowIDs,
	} = useSpreadsheetState();
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const [ widths, setWidths ] = useState({});

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

	// When a new column is created, set the default width to 100px;
	useEffect(
		() => {
			columns.forEach((col) => {
				setWidths((prevWidths) => {
					return prevWidths[col.id] ? prevWidths : { ...prevWidths, [col.id]: 100 };
				});
			});
		},
		[ columns ],
	);

	const resizeColumn = ({ dataKey, deltaX }) =>
		setWidths((prevWidths) => {
			// for empty columns
			if (!dataKey) {
				return prevWidths;
			}
			return {
				...prevWidths,
				// don't allow columns to shrink below 50px
				[dataKey]: Math.max(prevWidths[dataKey] + deltaX, 50),
			};
		});

	function isSelectedCell(row, column) {
		function withinRange(value) {
			const { top, right, bottom, left } = value;
			if (column === null) {
				return row >= top && row <= bottom;
			} else if (row === null) {
				return column >= left && column <= right;
			} else {
				return row >= top && row <= bottom && column >= left && column <= right;
			}
		}
		const withinASelectedRange = cellSelectionRanges.some(withinRange);
		return withinASelectedRange || (currentCellSelectionRange && withinRange(currentCellSelectionRange));
	}

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

	function modifyRowSelectionRange(row) {
		dispatchSpreadsheetAction({ type: MODIFY_CURRENT_SELECTION_ROW_RANGE, endRangeRow: row });
	}

	function finishCurrentSelectionRange() {
		dispatchSpreadsheetAction({ type: ADD_CURRENT_SELECTION_TO_CELL_SELECTIONS });
	}

	function finishCurrentSelectionRowRange() {
		dispatchSpreadsheetAction({ type: ADD_CURRENT_SELECTION_TO_ROW_SELECTIONS });
	}

	function handleContextMenu(e) {
		e.preventDefault();
		dispatchSpreadsheetAction({ type: OPEN_CONTEXT_MENU, contextMenuPosition: { left: e.pageX, top: e.pageY } });
	}

	const headerRenderer = (props, columnIndex) => {
		function openModal(e) {
			if (!props.dataKey) {
				if (columnIndex >= columns.length) {
					createNewColumns(columnIndex + 1 - columns.length);
					return;
				}
			}
			dispatchSpreadsheetAction({ type: REMOVE_SELECTED_CELLS });
			dispatchSpreadsheetAction({
				type: TOGGLE_COLUMN_TYPE_MODAL,
				columnTypeModalOpen: true,
				column: columns.find((col) => col.id === props.dataKey),
			});
		}
		return (
			<React.Fragment key={props.dataKey}>
				<div
					style={{ userSelect: 'none', backgroundColor: isSelectedCell(null, columnIndex + 1) && 'rgb(160,185,225)' }}
					onClick={(e) => {
						if (columnIndex < columns.length) {
							if (contextMenuOpen) {
								dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
							}
							dispatchSpreadsheetAction({
								type: SELECT_COLUMN,
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
								columnIndex,
								selectionActive: e.ctrlKey || e.shiftKey || e.metaKey,
							});
							dispatchSpreadsheetAction({
								type: OPEN_CONTEXT_MENU,
								colName: props.label,
								contextMenuType: 'column',
								contextMenuPosition: { left: e.pageX, top: e.pageY },
							});
						}
					}}
					className="ReactVirtualized__Table__headerTruncatedText"
				>
					{props.label}
				</div>
				<Draggable
					axis="x"
					defaultClassName="DragHandle"
					defaultClassNameDragging="DragHandleActive"
					onDrag={(event, { deltaX }) =>
						resizeColumn({
							dataKey: props.dataKey,
							deltaX,
						})}
					position={{ x: 0 }}
					zIndex={999}
				>
					<span
						style={{ userSelect: 'none', backgroundColor: isSelectedCell(null, columnIndex + 1) && 'rgb(160,185,225)' }}
						className="DragHandleIcon"
					>
						⋮
					</span>
				</Draggable>
			</React.Fragment>
		);
	};

	function cellRenderer({ rowIndex, columnIndex, rowData, cellData, dataKey }) {
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
					row={rowData}
					rowIndex={rowIndex}
					rows={rows}
					value={cellData}
				/>
			);
		} else if (selectedRowIDs.includes(rowData.id) || isSelectedCell(rowIndex, columnIndex)) {
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
					paste={paste}
					row={rowData}
					rows={rows}
					rowIndex={rowIndex}
					cellValue={cellData}
				/>
			);
		} else if (rowIndex === rows.length) {
			// This is a blank clickable row
			if (dataKey) {
				return (
					<div
						style={{ backgroundColor: 'white', height: '100%', width: '100%' }}
						onMouseDown={(e) => {
							e.preventDefault();
							if (contextMenuOpen) {
								dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
							}
							selectCell(rowIndex, columnIndex);
						}}
					/>
				);
			} else {
				// Cells in blank clickable row not in a defined column
				return (
					<div
						onDoubleClick={(e) => {
							e.preventDefault();
							if (contextMenuOpen) {
								dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
							}
							if (columnIndex > columns.length) {
								createNewColumns(columnIndex - columns.length);
							}
						}}
						style={{ backgroundColor: '#eee', height: '100%', width: '100%' }}
					/>
				);
			}
		} else if (!rowData.id) {
			// The cells in these rows cannot be clicked
			return <div style={{ backgroundColor: '#eee', height: '100%', width: '100%' }} />;
		} else if (dataKey) {
			return (
				<NormalCell
					key={`Row${rowIndex}Col${columnIndex}`}
					changeActiveCell={changeActiveCell}
					columns={columns}
					columnId={dataKey}
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
				// cells in defined rows but undefined columns
				<div
					style={{ backgroundColor: '#eee', height: '100%', width: '100%' }}
					key={`row${rowIndex}col${columnIndex}`}
					onDoubleClick={(e) => {
						e.preventDefault();
						if (contextMenuOpen) {
							dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
						}
						if (columnIndex > columns.length) {
							createNewColumns(columnIndex - columns.length);
						}
					}}
				/>
			);
		}
	}

	function rowHeadersOnDoubleClick(e, rowIndex) {
		e.preventDefault();
		if (rowIndex + 1 > rows.length) {
			createNewRows(rowIndex + 1 - rows.length);
		}
	}

	function rowHeaders({ rowIndex }) {
		// only show row numbers of existing rows
		return (
			<div
				onContextMenu={(e) => {
					if (rowIndex < rows.length) {
						e.preventDefault();
						dispatchSpreadsheetAction({
							type: SELECT_ROW,
							rowIndex,
						});
						dispatchSpreadsheetAction({
							type: OPEN_CONTEXT_MENU,
							contextMenuType: 'row',
							rowIndex,
							contextMenuPosition: { left: e.pageX, top: e.pageY },
						});
					}
				}}
				onMouseDown={(e) => {
					if (rowIndex < rows.length) {
						if (contextMenuOpen) {
							dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
						}
						dispatchSpreadsheetAction({
							type: SELECT_ROW,
							rowIndex,
							selectionActive: e.ctrlKey || e.shiftKey || e.metaKey,
						});
					}
				}}
				onMouseEnter={(e) => {
					if (typeof e.buttons === 'number' && e.buttons > 0) {
						modifyRowSelectionRange(rowIndex);
					}
				}}
				onMouseUp={finishCurrentSelectionRange}
				onDoubleClick={(e) => rowHeadersOnDoubleClick(e, rowIndex)}
				className={'row-number-cell'}
				style={{
					borderBottom: '1px solid rgb(221, 221, 221)',
					userSelect: 'none',
					lineHeight: 2,
					backgroundColor: isSelectedCell(rowIndex, null) && 'rgb(160,185,225)',
				}}
			>
				{rows.length > rowIndex && rowIndex + 1}
			</div>
		);
	}

	const emptyRow = {};
	const visibleColumns = Math.max(columns.length + 3, Math.ceil(window.innerWidth / 100));
	const visibleRows = Math.max(rows.length + 5, Math.ceil(window.innerHeight / 30));
	const columnsDiff = visibleColumns - columns.length;
	const blankColumnWidth = 100;

	function renderColumns(totalColumnCount) {
		// Render column if it exists, otherwise render a blank column
		const colsContainer = [];
		for (let columnIndex = 0; columnIndex < totalColumnCount; columnIndex++) {
			const column = columns[columnIndex];
			colsContainer.push(
				<Column
					key={columnIndex}
					cellRenderer={cellRenderer}
					columnIndex={columnIndex}
					headerRenderer={(props) => headerRenderer(props, columnIndex)}
					dataKey={(column && column.id) || ''}
					label={(column && column.label) || ''}
					width={(column && widths[column.id]) || blankColumnWidth}
					style={{
						border: '1px solid #ddd',
						borderLeft: columnIndex === 0 ? '1 px solid #ddd' : 'none',
						margin: 0,
					}}
				/>,
			);
		}
		return colsContainer;
	}

	function sumOfColumnWidths(columns) {
		let total = 0;
		for (let i = 0; i < columns.length; i++) {
			total += columns[i];
		}
		return total;
	}

	useEffect(() => {
		function onKeyDown(event) {
			if (event.key === 'Escape') {
				dispatchSpreadsheetAction({ type: REMOVE_SELECTED_CELLS });
			}
			if (activeCell) {
				return;
			}
			if (event.metaKey || event.ctrlKey) {
				if (event.key === 'c') {
					dispatchSpreadsheetAction({ type: COPY_VALUES });
					return;
				} else if (event.key === 'v') {
					paste();
					return;
				} else if (event.key === 'a') {
					dispatchSpreadsheetAction({ type: SELECT_ALL_CELLS });
					return;
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
			<ContextMenu paste={paste} />
			{selectedColumn && <ColumnTypeModal selectedColumn={selectedColumn} />}
			{distributionModalOpen && <DistributionModal />}
			{analysisModalOpen && <AnalysisModal />}
			{filterModalOpen && <FilterModal selectedColumn={selectedColumn} />}
			{widths && (
				<AutoSizer>
					{({ height }) => (
						<Table
							overscanRowCount={0}
							width={sumOfColumnWidths(Object.values(widths)) + columnsDiff * blankColumnWidth}
							height={height}
							headerHeight={25}
							rowHeight={30}
							rowCount={visibleRows}
							rowGetter={({ index }) => rows[index] || emptyRow}
							rowStyle={{ alignItems: 'stretch' }}
						>
							<Column
								width={50}
								label={''}
								dataKey={'rowHeaderColumn'}
								headerRenderer={() => <AnalysisMenu />}
								cellRenderer={rowHeaders}
								style={{ margin: 0 }}
							/>
							{renderColumns(visibleColumns)}
						</Table>
					)}
				</AutoSizer>
			)}
		</div>
	);
}

export default Spreadsheet;
