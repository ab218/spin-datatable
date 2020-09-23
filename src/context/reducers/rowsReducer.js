import {
	selectRowAndColumnIDs,
	createRandomLetterString,
	createRandomID,
	getCol,
	updateRow,
	findCyclicDependencies,
	updateRows,
	generateUniqueRowIDs,
	getAllFilteredRows,
	updateFiltersOnPaste,
	updateFiltersOnCellUpdate,
} from '../helpers';

import {
	COPY_VALUES,
	CREATE_COLUMNS,
	CREATE_ROWS,
	DELETE_FILTER,
	DELETE_ROWS,
	DELETE_COLUMN,
	DELETE_VALUES,
	EXCLUDE_ROWS,
	HIGHLIGHT_FILTERED_ROWS,
	FILTER_COLUMN,
	FILTER_INCLUDE_ROWS,
	FILTER_UNINCLUDE_ROWS,
	FILTER_EXCLUDE_ROWS,
	FILTER_UNEXCLUDE_ROWS,
	PASTE_VALUES,
	REDO,
	REMOVE_FILTERED_ROWS,
	REMOVE_HIGHLIGHTED_FILTERED_ROWS,
	REMOVE_SIDEBAR_FILTER,
	SAVE_FILTER,
	SAVE_NEW_FILTER,
	SAVE_VALUES_TO_COLUMN,
	SET_FILTERS,
	SET_TABLE_NAME,
	SORT_COLUMN,
	UNEXCLUDE_ROWS,
	UNDO,
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
		dataTableName,
		descending,
		values,
		rowCount,
		rowIndex,
		updatedColumn,
		includedRows,
		xLabel,
		yLabel,
	} = action;
	// const { type, ...event } = action;
	const { type } = action;
	// state.eventBus.fire(type, event);
	// console.log('dispatched:', type, 'with action:', action, 'state: ', state);
	switch (type) {
		case 'CLEAR_ERROR': {
			return { ...state, modalError: null };
		}
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
						return selectedColumnIDs.map((selectedColumn) => {
							const cellValue = row[selectedColumn];
							if (typeof cellValue === 'object') {
								return cellValue.error;
							}
							return row[selectedColumn];
						});
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
			return {
				...state,
				history: [ ...state.history, { rows: state.rows, columns: state.columns } ],
				redoHistory: [],
				columns,
				columnCounter,
			};
		}
		case CREATE_ROWS: {
			const newRows = Array(rowCount).fill(undefined).map((_) => {
				return { id: createRandomID() };
			});
			return {
				...state,
				history: [ ...state.history, { rows: state.rows, columns: state.columns } ],
				redoHistory: [],
				rows: state.rows.concat(newRows),
			};
		}
		case DELETE_COLUMN: {
			// BUG: If deleting all columns, row headers remain
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
				history: [ ...state.history, { rows: state.rows, columns: state.columns } ],
				redoHistory: [],
				rows: updatedFormulaRows,
				columns: filteredColumns,
			};
		}
		case DELETE_ROWS: {
			const { cellSelectionRanges } = action;
			const selectedRowIDs = generateUniqueRowIDs(cellSelectionRanges, state.rows);
			const filteredRows = state.rows.filter((row) => !selectedRowIDs.includes(row.id));
			const updatedExcludedRows = state.excludedRows.filter((id) => !selectedRowIDs.includes(id));
			return {
				...state,
				history: [ ...state.history, { rows: state.rows, columns: state.columns } ],
				redoHistory: [],
				rows: filteredRows,
				excludedRows: updatedExcludedRows,
			};
		}
		// EVENT: Paste
		case PASTE_VALUES: {
			const { top, left, height, width } = action;
			const { columns, rows } = state;
			const { selectedColumnIDs, selectedRowIDs } = selectRowAndColumnIDs(
				top,
				left,
				top + height - 1,
				left + width - 1,
				columns,
				rows,
			);
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

			const newRows = mapRows(state.rows, copiedValues2dArray, selectedColumnIDs, selectedRowIDs);

			return {
				...state,
				history: [ ...state.history, { rows: state.rows, columns: state.columns } ],
				redoHistory: [],
				rows: newRows,
				// If there are any saved filters, update them with the new rows data
				savedFilters: state.savedFilters.length
					? updateFiltersOnPaste(newRows, state.savedFilters)
					: state.savedFilters,
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
			return {
				...state,
				history: [ ...state.history, { rows: state.rows, columns: state.columns } ],
				redoHistory: [],
				rows: newRows,
			};
		}
		case EXCLUDE_ROWS: {
			const { excludedRows, rows } = state;
			const { cellSelectionRanges } = action;
			return {
				...state,
				excludedRows: [ ...new Set(excludedRows.concat(generateUniqueRowIDs(cellSelectionRanges, rows))) ],
			};
		}
		case UNEXCLUDE_ROWS: {
			const { excludedRows, rows } = state;
			const { cellSelectionRanges } = action;
			return {
				...state,
				excludedRows: excludedRows.filter((row) => !generateUniqueRowIDs(cellSelectionRanges, rows).includes(row)),
			};
		}
		case FILTER_EXCLUDE_ROWS: {
			const { filter: { filteredRowIDs, id } } = action;
			return {
				...state,
				excludedRows: [ ...new Set(state.excludedRows.concat(filteredRowIDs)) ],
				includedRows: [],
				appliedFilterExclude: id,
				appliedFilterInclude: [],
			};
		}
		case FILTER_UNEXCLUDE_ROWS: {
			const { filter: { filteredRowIDs } } = action;
			return {
				...state,
				excludedRows: state.excludedRows.filter((rowID) => !filteredRowIDs.includes(rowID)),
				filterExcludedRows: [],
				appliedFilterExclude: [],
			};
		}
		case FILTER_INCLUDE_ROWS: {
			const { filter: { filteredRowIDs, id } } = action;
			return {
				...state,
				includedRows: [ ...new Set(state.includedRows.concat(filteredRowIDs)) ],
				excludedRows: [],
				appliedFilterInclude: id,
				appliedFilterExclude: [],
			};
		}
		case FILTER_UNINCLUDE_ROWS: {
			const { filter: { filteredRowIDs } } = action;
			return {
				...state,
				includedRows: state.excludedRows.filter((rowID) => !filteredRowIDs.includes(rowID)),
				filterIncludedRows: [],
				appliedFilterInclude: [],
			};
		}
		case FILTER_COLUMN: {
			const allFilteredRows = getAllFilteredRows(state.rows, state.filters);
			const filteredRowIDs = allFilteredRows.map((row) => row.id);
			return {
				...state,
				activeCell: null,
				filteredRowIDs,
				filteredColumnIDs: state.columns.map((col) => col.id),
			};
		}
		case SET_FILTERS: {
			const { selectedColumns, numberFilters, stringFilters, id, filterName } = action;
			const stringFilterCopy = { ...state.filters.stringFilters, ...stringFilters };
			return {
				...state,
				filters: {
					selectedColumns,
					id,
					filterName,
					stringFilters: stringFilterCopy,
					numberFilters: numberFilters || state.filters.numberFilters,
				},
			};
		}
		case HIGHLIGHT_FILTERED_ROWS: {
			const { filteredRowIDs } = action;
			return { ...state, filteredRowIDs };
		}
		case REMOVE_HIGHLIGHTED_FILTERED_ROWS: {
			return { ...state, filteredRowIDs: [] };
		}
		case SAVE_FILTER: {
			const { filters, filterName, script, selectedColumns } = action;
			const { id } = filters;
			const updatedFilter = {
				...filters,
				id,
				filterName,
				filteredRowIDs: state.filteredRowIDs,
				script,
				selectedColumns,
			};

			const updatedFilters = state.savedFilters.filter((filter) => filter.id !== id).concat(updatedFilter);

			return { ...state, savedFilters: updatedFilters };
		}
		case SAVE_NEW_FILTER: {
			const { filters, filterName, script, selectedColumns } = action;
			const newFilter = {
				...filters,
				id: createRandomID(),
				filterName,
				filteredRowIDs: state.filteredRowIDs,
				script,
				selectedColumns,
			};
			return { ...state, savedFilters: state.savedFilters.concat(newFilter) };
		}
		case REMOVE_SIDEBAR_FILTER: {
			const { filter } = action;
			const newFilters = state.savedFilters.filter((filt) => filt.id !== filter.id);
			return { ...state, savedFilters: newFilters };
		}
		case DELETE_FILTER: {
			const { filters } = action;
			return { ...state, filters };
		}
		case REMOVE_FILTERED_ROWS: {
			return { ...state, filteredRowIDs: [] };
		}
		case SAVE_VALUES_TO_COLUMN: {
			let valuesColumnsCounter = state.valuesColumnsCounter + 1;
			const newColumn = {
				id: createRandomLetterString(),
				modelingType: CONTINUOUS,
				type: NUMBER,
				label: `Values ${valuesColumnsCounter}`,
				description: `Generated from [${yLabel} by ${xLabel}] Bivariate Analysis output window.`,
			};
			let counter = 0;
			const newRows = state.rows.map((row, rowIndex) => {
				if (includedRows.includes(rowIndex + 1)) {
					const newRow = { ...row, [newColumn.id]: values[counter] };
					counter++;
					return newRow;
				}
				return { ...row };
			});
			const columns = state.columns.concat(newColumn);
			return {
				...state,
				history: [ ...state.history, { rows: state.rows, columns: state.columns } ],
				redoHistory: [],
				rows: newRows,
				columns,
				valuesColumnsCounter,
			};
		}
		case SET_TABLE_NAME: {
			return {
				...state,
				dataTableName,
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
			return {
				...state,
				history: [ ...state.history, { rows: state.rows, columns: state.columns } ],
				redoHistory: [],
				rows: deepCopyRows,
			};
		}
		case UNDO: {
			const { history, redoHistory } = state;
			const prevHistory = history[history.length - 1];
			const newHistory = history.slice(0, -1);

			if (history.length > 0) {
				return {
					...state,
					redoHistory: [ ...redoHistory, { rows: state.rows, columns: state.columns } ],
					history: newHistory,
					rows: prevHistory.rows,
					columns: prevHistory.columns,
				};
			}
			return {
				...state,
			};
		}
		case REDO: {
			const { history, redoHistory } = state;
			const prevRedo = redoHistory[redoHistory.length - 1];
			const newRedoHistory = redoHistory.slice(0, -1);

			if (redoHistory.length > 0) {
				return {
					...state,
					history: [ ...history, { rows: state.rows, columns: state.columns } ],
					redoHistory: newRedoHistory,
					rows: prevRedo.rows,
					columns: prevRedo.columns,
				};
			}
			return { ...state };
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

			return {
				...state,
				history: [ ...state.history, { rows: state.rows, columns: state.columns } ],
				redoHistory: [],
				rows: changedRows,
				// If there are any saved filters, update them with the new rows data
				savedFilters: state.savedFilters.length
					? updateFiltersOnCellUpdate(state.savedFilters, cellValue, column, row.id)
					: state.savedFilters,
			};
		}
		case UPDATE_COLUMN: {
			const { rows, columns } = state;
			const columnCopy = { ...updatedColumn };
			const originalPosition = columns.findIndex((col) => col.id === columnCopy.id);
			const updatedColumns = columns
				.slice(0, originalPosition)
				.concat(columnCopy)
				.concat(columns.slice(originalPosition + 1));

			const prevColumn = columns.find((col) => col.id === columnCopy.id);

			function removeDependenciesFromMap() {
				const inverseDependencyMapCopy = { ...state.inverseDependencyMap };
				const inverseDependencyMapCopyKeys = Object.keys(inverseDependencyMapCopy);
				inverseDependencyMapCopyKeys.forEach((key) => {
					if (inverseDependencyMapCopy[key].includes(columnCopy.id)) {
						const filteredDependencies = inverseDependencyMapCopy[key].filter((id) => id !== columnCopy.id);
						if (filteredDependencies.length === 0) {
							delete inverseDependencyMapCopy[key];
						} else {
							inverseDependencyMapCopy[key] = filteredDependencies;
						}
					}
				});
				return inverseDependencyMapCopy;
			}

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
					modalError: null,
					history:
						updatedRows.length > 0 ? [ ...state.history, { rows: state.rows, columns: state.columns } ] : state.history,
					rows: updatedRows.length > 0 ? updatedRows : rows,
					inverseDependencyMap,
				};
			}

			return {
				...state,
				columns: updatedColumns,
				modalError: null,
				inverseDependencyMap:
					prevColumn.type === 'Formula' && columnCopy.type !== 'Formula'
						? removeDependenciesFromMap()
						: state.inverseDependencyMap,
			};
		}
		default: {
			throw new Error(`Unhandled action type: ${type}`);
		}
	}
}
