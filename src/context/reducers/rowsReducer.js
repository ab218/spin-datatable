import {
	selectRowAndColumnIDs,
	createRandomLetterString,
	createRandomID,
	getCol,
	updateRow,
	findCyclicDependencies,
	updateRows,
} from '../helpers';

import {
	COPY_VALUES,
	CREATE_COLUMNS,
	CREATE_ROWS,
	DELETE_ROWS,
	DELETE_COLUMN,
	DELETE_VALUES,
	PASTE_VALUES,
	SAVE_VALUES_TO_COLUMN,
	SORT_COLUMN,
	UPDATE_CELL,
	UPDATE_COLUMN,
	CONTINUOUS,
	FORMULA,
	NUMBER,
} from '../../constants';

export function rowsReducer(state, action) {
	const {
		cellValue,
		colName,
		columnIndex,
		columnCount,
		copiedValues2dArray,
		descending,
		values,
		rowCount,
		rowIndex,
		updatedColumn,
		top,
		left,
		height,
		width,
	} = action;
	// const { type, ...event } = action;
	const { type } = action;
	// state.eventBus.fire(type, event);
	// console.log('dispatched:', type, 'with action:', action, 'state: ', state);
	switch (type) {
		// On text input of a selected cell, value is cleared, cell gets new value and cell is activated
		case COPY_VALUES: {
			// TODO: There should be a line break if the row is undefined values
			// TODO: There should be no line break for the first row when you copy
			const { columns, rows } = state;
			const { cellSelectionRanges } = action;
			// Fixes crash if cell from non existant column is selected
			if (!cellSelectionRanges.length) return { ...state };
			// const copyEl = (elToBeCopied) => {
			// 	let range, sel;
			// 	// Ensure that range and selection are supported by the browsers
			// 	if (document.createRange && window.getSelection) {
			// 		range = document.createRange();
			// 		sel = window.getSelection();
			// 		// unselect any element in the page
			// 		sel.removeAllRanges();
			// 		try {
			// 			range.selectNodeContents(elToBeCopied);
			// 			sel.addRange(range);
			// 		} catch (e) {
			// 			console.log(e);
			// 		}
			// 		document.execCommand('copy');
			// 	}
			// 	sel.removeAllRanges();
			// 	console.log('Element Copied!');
			// };

			// function createTable(tableData) {
			// 	const table = document.createElement('table');
			// 	table.setAttribute('id', 'copy-table');
			// 	let row = {};
			// 	let cell = {};
			// 	tableData.forEach((rowData) => {
			// 		row = table.insertRow(-1); // -1 is for safari
			// 		rowData.forEach((cellData) => {
			// 			cell = row.insertCell();
			// 			cell.textContent = cellData;
			// 		});
			// 	});
			// 	document.body.appendChild(table);
			// 	copyEl(table);
			// 	document.body.removeChild(table);
			// }

			// In case there are multiple selection ranges, we only want the first selection made
			const { top, left, bottom, right } = cellSelectionRanges[0];
			const { selectedColumnIDs, selectedRowIDs } = selectRowAndColumnIDs(top, left, bottom, right, columns, rows);
			const copiedRows = rows
				.map((row) => {
					if (selectedRowIDs.includes(row.id)) {
						return selectedColumnIDs.map((selectedColumn) => row[selectedColumn]);
					}
					return null;
				})
				.filter((x) => x);
			const clipboardContents = copiedRows.map((row) => row.join('\t')).join('\n');
			navigator.clipboard
				.writeText(clipboardContents)
				.then(() => console.log('wrote to clipboard', clipboardContents))
				.catch((args) => console.error('did not copy to clipboard:', args));
			return { ...state };
		}
		case CREATE_COLUMNS: {
			let columnCounter = state.columnCounter || state.columns.length;
			const newColumns = Array(columnCount).fill(undefined).map((_, i) => {
				const id = createRandomLetterString();
				columnCounter++;
				return { id, modelingType: CONTINUOUS, type: NUMBER, label: `Column ${columnCounter}`, description: '' };
			});
			const columns = state.columns.concat(newColumns);
			return { ...state, columns, columnCounter };
		}
		case CREATE_ROWS: {
			const newRows = Array(rowCount).fill(undefined).map((_) => {
				return { id: createRandomID() };
			});
			return { ...state, rows: state.rows.concat(newRows) };
		}
		case DELETE_COLUMN: {
			const { rows } = state;
			const column = getCol(state.columns, colName);
			const columnID = column.id;
			const filteredColumns = state.columns.filter((col) => col.id !== columnID);

			const newRows = rows.reduce((acc, currentRow) => {
				const { [columnID]: value, ...rest } = currentRow;
				return [ ...acc, rest ];
			}, []);

			const updatedFormulaRows = newRows.map((row) => {
				let rowCopy = { ...row };
				if (Array.isArray(state.inverseDependencyMap[columnID])) {
					for (const dependencyColumnID of state.inverseDependencyMap[columnID]) {
						rowCopy = updateRow(rowCopy, dependencyColumnID, state.columns, state.inverseDependencyMap);
					}
				}
				return rowCopy;
			});
			return {
				...state,
				rows: updatedFormulaRows,
				columns: filteredColumns,
				// currentCellSelectionRange: null,
				// cellSelectionRanges: [],
				// selectedRowIDs: [],
				// activeCell: null,
			};
		}
		case DELETE_ROWS: {
			const filteredRows = state.rows.filter((row) => !state.uniqueRowIDs.includes(row.id));
			return {
				...state,
				rows: filteredRows,
				// currentCellSelectionRange: null,
				// cellSelectionRanges: [],
				// selectedRowIDs: [],
				// activeCell: null,
			};
		}
		// EVENT: Paste
		case PASTE_VALUES: {
			function mapRows(rows, copiedValues, destinationColumns, destinationRows) {
				const indexOfFirstDestinationRow = rows.findIndex((row) => row.id === destinationRows[0]);
				// We create an updated copy of the rows that are to be changed as a result of the paste operation
				const newRowValues = [];
				for (let copiedValuesIndex = 0; copiedValuesIndex < copiedValues.length; copiedValuesIndex++) {
					const newRowValue = { ...rows[indexOfFirstDestinationRow + copiedValuesIndex] };
					for (let colIndex = 0; colIndex < destinationColumns.length; colIndex++) {
						const targetColumn = state.columns.find((col) => col.id === destinationColumns[colIndex]);
						if (targetColumn && targetColumn.type === 'Formula') {
							newRowValue[destinationColumns[colIndex]] = {
								error: '#FORMERR',
								errorMessage: 'Please verify formula is still correct after paste operation',
							};
						} else {
							newRowValue[destinationColumns[colIndex]] = copiedValues[copiedValuesIndex][colIndex];
						}
					}
					newRowValues.push(newRowValue);
				}
				return rows
					.slice(0, indexOfFirstDestinationRow)
					.concat(newRowValues)
					.concat(rows.slice(indexOfFirstDestinationRow + newRowValues.length));
			}

			const { selectedColumnIDs, selectedRowIDs } = selectRowAndColumnIDs(
				top,
				left,
				top + height - 1,
				left + width - 1,
				state.columns,
				state.rows,
			);

			return {
				...state,
				uniqueColumnIDs: selectedColumnIDs,
				uniqueRowIDs: selectedRowIDs,
				// cellSelectionRanges: [
				// 	{
				// 		top: top,
				// 		left: left,
				// 		bottom: top + height - 1,
				// 		right: left + width - 1,
				// 	},
				// ],
				rows: mapRows(state.rows, copiedValues2dArray, selectedColumnIDs, selectedRowIDs),
			};
		}
		// EVENT: Delete values
		case DELETE_VALUES: {
			console.log(state);
			const { cellSelectionRanges } = action;
			function removeKeyReducer(container, key) {
				const { [key]: value, ...rest } = container;
				return rest;
			}
			const newRows = cellSelectionRanges.reduce((rows, { top, left, bottom, right }) => {
				const { selectedColumnIDs, selectedRowIDs } = selectRowAndColumnIDs(
					top,
					left,
					bottom,
					right,
					state.columns,
					state.rows,
				);
				return rows.map((row) => {
					let rowCopy = { ...row };
					if (selectedRowIDs.includes(rowCopy.id)) {
						const rowWithKeysRemoved = selectedColumnIDs.reduce(removeKeyReducer, rowCopy);
						return selectedColumnIDs.reduce((newRow, colID) => {
							if (Array.isArray(state.inverseDependencyMap[colID])) {
								for (const dependencyColumnID of state.inverseDependencyMap[colID]) {
									return (rowCopy = updateRow(
										rowWithKeysRemoved,
										dependencyColumnID,
										state.columns,
										state.inverseDependencyMap,
									));
								}
							}
							return newRow;
						}, rowWithKeysRemoved);
					} else {
						return rowCopy;
					}
				});
			}, state.rows);
			return { ...state, rows: newRows };
		}
		case SAVE_VALUES_TO_COLUMN: {
			let valuesColumnsCounter = state.valuesColumnsCounter + 1;
			const newColumn = {
				id: createRandomLetterString(),
				modelingType: CONTINUOUS,
				type: NUMBER,
				label: `Values ${valuesColumnsCounter}`,
				description: `Generated from [${action.yLabel} by ${action.xLabel}] Bivariate Analysis output window.`,
			};
			const columns = state.columns.concat(newColumn);
			const newRows = state.rows.map((row, i) => {
				return { ...row, [newColumn.id]: values[i] };
			});
			return {
				...state,
				rows: newRows,
				columns,
				valuesColumnsCounter,
			};
		}
		case SORT_COLUMN: {
			const targetColumn = getCol(state.columns, colName);
			// TODO: Any better way to do this without the deep copy?
			const deepCopyRows = JSON.parse(JSON.stringify(state.rows));
			if (targetColumn.type === 'Number' || targetColumn.type === 'Formula') {
				deepCopyRows.sort(
					(a, b) =>
						descending
							? [ b[targetColumn.id] ] - [ a[targetColumn.id] ]
							: [ a[targetColumn.id] ] - [ b[targetColumn.id] ],
				);
			} else if (targetColumn.type === 'String') {
				deepCopyRows.sort(
					(a, b) =>
						descending
							? b[targetColumn.id].localeCompare(a[targetColumn.id])
							: a[targetColumn.id].localeCompare(b[targetColumn.id]),
				);
			}
			return { ...state, rows: deepCopyRows };
		}
		// EVENT: Cell updated
		case UPDATE_CELL: {
			const { rows, columns } = state;
			// TODO: If active cell, use that, if selected cells, use top left corner of it
			// row from action or last row from state
			const column = columns[columnIndex];
			const row = rows[rowIndex] || rows[rows.length - 1];
			const newRows = rows.slice();
			const { id: columnID } = column || columns[columns.length - 1];
			let rowCopy = { ...row, [columnID]: cellValue };
			if (Array.isArray(state.inverseDependencyMap[columnID])) {
				for (const dependencyColumnID of state.inverseDependencyMap[columnID]) {
					rowCopy = updateRow(rowCopy, dependencyColumnID, state.columns, state.inverseDependencyMap);
				}
			}

			const changedRows = Object.assign(newRows, { [rowIndex]: rowCopy });
			return { ...state, rows: changedRows };
		}
		case UPDATE_COLUMN: {
			const { rows, columns } = state;
			const columnCopy = { ...updatedColumn };
			const originalPosition = columns.findIndex((col) => col.id === columnCopy.id);
			const updatedColumns = columns
				.slice(0, originalPosition)
				.concat(columnCopy)
				.concat(columns.slice(originalPosition + 1));

			if (columnCopy.formula && columnCopy.formula.expression && columnCopy.formula.expression.trim()) {
				const formulaColumns = updatedColumns.filter(({ type }) => {
					return type === FORMULA;
				});
				const inverseDependencyMap = formulaColumns.reduce((invDepMap, formulaColumn) => {
					return (
						formulaColumn.formula &&
						formulaColumn.formula.IDs.reduce((acc, dependentColumnID) => {
							return { ...acc, [dependentColumnID]: (acc[dependentColumnID] || []).concat(formulaColumn.id) };
						}, invDepMap)
					);
				}, {});

				const cycles = findCyclicDependencies(inverseDependencyMap, columnCopy.id);
				if (cycles.length > 0) {
					console.log('cycle detected. stack: ', cycles);
					return { ...state, modalError: 'Reference Error - Infinite cycle detected' };
				}

				const updatedRows = updateRows(rows, columnCopy.id, updatedColumns, inverseDependencyMap);

				if (updatedRows.length === 0) {
					return {
						...state,
						modalError: 'Invalid formula entered',
					};
				}

				return {
					...state,
					columns: updatedColumns,
					// columnTypeModalOpen: false,
					// selectedColumn: null,
					// modalError: null,
					rows: updatedRows.length > 0 ? updatedRows : rows,
					inverseDependencyMap,
				};
			}

			return {
				...state,
				columns: updatedColumns,
				// columnTypeModalOpen: false,
				// modalError: null,
				// selectedColumn: null,
			};
		}
		default: {
			throw new Error(`Unhandled action type: ${type}`);
		}
	}
}
