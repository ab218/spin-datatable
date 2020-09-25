import nerdamer from 'nerdamer';
import { TEXT } from '../constants';

export function createRandomID() {
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 10; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
}

export function createRandomLetterString() {
	const upperAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const alphabet = upperAlphabet + upperAlphabet.toLowerCase();
	return (
		'_' +
		Array(10).fill(undefined).map((_) => alphabet.charAt(Math.floor(Math.random() * alphabet.length))).join('') +
		'_'
	);
}

// quickly build rows out of copy/pasted data
export function createRows(table, columns) {
	const tableRows = table.split('\n');
	const table2d = tableRows.map((row) => row.split('\t'));
	const rows = [];
	for (let i = 0; i < table2d.length; i++) {
		const obj = { id: createRandomID() };
		for (let j = 0; j < columns.length; j++) {
			obj[columns[j].id] = table2d[i][j];
		}
		rows.push(obj);
	}
	return rows;
}

export function getUniqueListBy(arr, key) {
	return [ ...new Map(arr.map((item) => [ item[key], item ])).values() ];
}

export const updateFiltersOnPaste = (rows, filters) => {
	const newFilters = filters.map((filter) => {
		const filteredRows = getAllFilteredRows(rows, filter);
		const filteredRowIDs = filteredRows.map((row) => row.id);
		return { ...filter, filteredRowIDs };
	});
	return newFilters;
};

export const updateFiltersOnCellUpdate = (filters, cellValue, column, rowID) => {
	const newFilters = filters.map((filter) => {
		if (column.type === TEXT && filter.stringFilters[column.id]) {
			return filter.stringFilters[column.id].includes(cellValue)
				? { ...filter, filteredRowIDs: [ ...filter.filteredRowIDs, rowID ] }
				: { ...filter, filteredRowIDs: filter.filteredRowIDs.filter((id) => id !== rowID) };
		} else {
			const found = filter.numberFilters.find((numFil) => numFil.id === column.id);
			if (found) {
				return cellValue < found.max && cellValue > found.min
					? { ...filter, filteredRowIDs: [ ...filter.filteredRowIDs, rowID ] }
					: { ...filter, filteredRowIDs: filter.filteredRowIDs.filter((id) => id !== rowID) };
			} else {
				return { ...filter };
			}
		}
	});
	return newFilters;
};

export const getAllFilteredRows = (rows, filters) => {
	const { stringFilters, numberFilters } = filters;
	const filteredRowsByRange = filterRowsByColumnRange(numberFilters, rows);
	const filteredRowsByString = Object.keys(stringFilters).length
		? rows.filter(rowHasAllOfTheseColumns, stringFilters)
		: [];
	const intersection = returnIntersectionOrNonEmptyArray(filteredRowsByRange, filteredRowsByString);
	return intersection;
};

export function returnIntersectionOrNonEmptyArray(arr1, arr2) {
	const intersectionOfArr1AndArr2 = findIntersectionOfTwoArrays(arr1, arr2);
	if (arr1.length !== 0 && arr2.length !== 0) {
		return intersectionOfArr1AndArr2;
	} else if (arr1.length === 0) {
		return arr2;
	} else if (arr2.length === 0) {
		return arr1;
	}
}

export function filterRowsByColumnRange(selectedColumns, rows) {
	return rows.filter(rowValueWithinTheseColumnRanges, selectedColumns);
}

function rowValueWithinTheseColumnRanges(row) {
	const columns = this;
	return columns.every(
		(column) => row[column.id] >= (column.min || column.colMin) && row[column.id] <= (column.max || column.colMax),
	);
}

// Filter AND operation
export function rowHasAllOfTheseColumns(row) {
	return Object.keys(this).every((key) => {
		const filteredValue = this[key];
		const rowValue = row[key];
		return filteredValue.includes(rowValue);
	});
}

// Filter OR operation
export function rowHasSomeOfTheseColumns(row) {
	return Object.keys(row).some((columnID) => {
		return this[columnID] && this[columnID].includes(row[columnID]);
	});
}

function findIntersectionOfTwoArrays(arr1, arr2) {
	return arr2.filter((a) => arr1.some((b) => a === b));
}

export function findCyclicDependencies(definitions, identifier) {
	const stack = [];

	// Internal search function.
	const internalSearch = function(currentIdentifier) {
		if (stack.indexOf(currentIdentifier) !== -1) {
			return currentIdentifier === identifier;
		}
		stack.push(currentIdentifier);

		// Check all of the child nodes to see if they contain the node we are looking for.
		const found = definitions[currentIdentifier] && definitions[currentIdentifier].some(internalSearch);

		// Remove the current node from the stack if it's children do not contain the node we are looking for.
		if (!found) {
			stack.splice(stack.indexOf(currentIdentifier), 1);
		}
		return found;
	};

	// If there isn't a cyclic dependency then we return an empty array, otherwise we return the stack.
	return internalSearch(identifier) ? stack.concat(identifier) : [];
}

export function getRangeBoundaries({ startRangeRow, startRangeColumn, endRangeRow, endRangeColumn }) {
	const top = Math.min(startRangeRow, endRangeRow);
	const bottom = Math.max(startRangeRow, endRangeRow);
	const left = Math.min(startRangeColumn, endRangeColumn);
	const right = Math.max(startRangeColumn, endRangeColumn);
	return { top, left, bottom, right };
}

export function generateUniqueRowIDs(cellSelectionRanges, rows) {
	const range = (start, end) => Array(end - start + 1).fill().map((_, i) => start + i);
	const selectedRows = cellSelectionRanges.map((row) => range(row.top, row.bottom));
	const flattenedRowIndexes = selectedRows.flat();
	const rowIDs = rows.map((row, i) => flattenedRowIndexes.includes(i) && row.id).filter((x) => x);
	return rowIDs;
}

export function generateUniqueColumnIDs(cellSelectionRanges, columns) {
	const range = (start, end) => Array(end - start).fill().map((_, i) => start + i);
	const selectedColumns = cellSelectionRanges.map((column) => range(column.left, column.right + 1));
	const flattenedColumnIndexes = selectedColumns.flat();
	const columnIDs = columns.map((column, i) => flattenedColumnIndexes.includes(i) && column.id).filter((x) => x);
	return columnIDs;
}

export function getCol(columns, colName) {
	return columns.find((col) => col.label === colName);
}

export function selectRowsFromRowIDs(rowIDs, rows, columns) {
	return rows
		.map((row, i) => {
			if (rowIDs.includes(row.id)) {
				return { top: i, bottom: i, left: 0, right: columns.length };
			}
			return null;
		})
		.filter((x) => x);
}

export function selectRowAndColumnIDs(top, left, bottom, right, columns, rows) {
	const colPos = columns
		.map((col, i) => {
			return i >= left && i <= right && col.id;
		})
		.filter((x) => x);
	const rowPos = rows
		.map((row, i) => {
			return i >= top && i <= bottom && row.id;
		})
		.filter((x) => x);
	return { selectedColumnIDs: colPos, selectedRowIDs: rowPos };
}

function swapIDsForValuesInRow(oldExpression, row, columns) {
	let newExpression = '';
	Object.keys(row).forEach((rowKey) => {
		if (newExpression.includes(rowKey) || oldExpression.includes(rowKey)) {
			newExpression = newExpression
				? newExpression.split(rowKey).join(row[rowKey])
				: oldExpression.split(rowKey).join(row[rowKey]);
		}
	});
	columns.forEach((col) => {
		if (newExpression.includes(col.id)) {
			newExpression = 'REFERROR';
		}
	});
	return newExpression || oldExpression;
}

export function filterExcludedRows(rows, includedRows, excludedRows, column) {
	return rows
		.map((row) => {
			let cellValue;
			if (column.type === 'Number' || column.type === 'Formula') {
				cellValue = Number(row[column.id]);
			} else {
				cellValue = row[column.id];
			}
			return includedRows.length
				? includedRows.includes(row.id) && cellValue
				: !excludedRows.includes(row.id) && cellValue;
		})
		.filter(Boolean);
}

export function updateRow(row, columnID, columns, dependencyMap) {
	const emptyArray = [];
	const columnIDtoIndexMap = columns.reduce((acc, { id }, index) => {
		return { ...acc, [id]: index };
	}, {});
	const getDependentColumns = (column) => {
		return column ? [ column ].concat((dependencyMap[column] || emptyArray).map(getDependentColumns)) : emptyArray;
	};
	const dependencyList = [ columnID ].map(getDependentColumns).flat(Infinity);
	try {
		const updatedRow = dependencyList.reduce((rowSoFar, columnID) => {
			const columnIndex = columnIDtoIndexMap[columnID];
			const columnFormula = columns[columnIndex].formula.expression;
			const updatedFormula = swapIDsForValuesInRow(columnFormula, rowSoFar, columns);
			const containsLetters = (input) => /[A-Za-z]/.test(input);
			if (updatedFormula === 'REFERROR') {
				return {
					...rowSoFar,
					[columnID]: { error: '#REF', errorMessage: 'Variable referenced in formula is invalid' },
				};
			}
			if (containsLetters(updatedFormula)) {
				return {
					...rowSoFar,
					[columnID]: { error: '#FORMERR', errorMessage: 'There is a problem with the formula' },
				};
			}
			return {
				...rowSoFar,
				[columnID]: nerdamer(updatedFormula).text('decimals', 6),
			};
		}, row);
		return updatedRow;
	} catch (e) {
		console.log('could not create row', e);
		return { ...row, [columnID]: { error: e.name, errorMessage: e.message } };
	}
}

export function updateRows(rows, columnID, columns, dependencyMap) {
	return rows
		.map((row) => {
			return updateRow(row, columnID, columns, dependencyMap);
		})
		.filter((x) => x);
}
