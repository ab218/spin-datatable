/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useCallback } from 'react';
import { useRowsState, useColumnWidthState, useColumnWidthDispatch } from './context/SpreadsheetProvider';
import CellRenderer from './CellRenderer';
import AnalysisMenu from './AnalysisMenu';
import Sidebar from './Sidebar';
import RowHeaders from './RowHeaders';
import HeaderRenderer from './HeaderRenderer';
import { Column, Table, AutoSizer } from 'react-virtualized';

const blankColumnWidth = 100;

export const checkIfValidNumber = (str) => {
	if (str.match(/^-?\d*\.?\d*$/)) {
		return false;
	}
	return str;
};

export default React.memo(function TableView() {
	const { rows, columns } = useRowsState();
	const { widths } = useColumnWidthState();
	const dispatchColumnWidthAction = useColumnWidthDispatch();
	const [ visibleColumns, setVisibleColumns ] = useState(1);
	const [ visibleRows, setVisibleRows ] = useState(1);

	// When a new column is created, set the default width to 100px;
	useEffect(() => {
		columns.forEach((col) => {
			dispatchColumnWidthAction({ type: 'RESIZE_COLUMN', dataKey: col.id, deltaX: 100 });
		});
	}, []);

	useEffect(
		() => {
			setVisibleColumns(Math.max(columns.length + 3, Math.ceil(window.innerWidth / 100)));
			setVisibleRows(Math.max(rows.length + 5, Math.ceil(window.innerHeight / 30)));
		},
		[ window.innerWidth, window.innerHeight, rows, columns ],
	);

	const columnsDiff = visibleColumns - columns.length;

	function sumOfColumnWidths(columns) {
		let total = 0;
		for (let i = 0; i < columns.length; i++) {
			total += columns[i];
		}
		return total;
	}

	const emptyRow = {};

	const cellRendererCallback = useCallback((column) => (props) => {
		// rowData = rowID, dataKey = columnID
		const { dataKey: columnID, rowData } = props;
		const rowID = rowData.id;
		return <CellRenderer {...props} column={column} columnID={columnID} rowsLength={rows.length} rowID={rowID} />;
	});

	return (
		// Height 100% necessary for autosizer to work
		<div style={{ height: '100%', width: '100%', display: 'flex' }}>
			<Sidebar />
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
							width={100}
							label={''}
							dataKey={'rowHeaderColumn'}
							headerRenderer={() => <AnalysisMenu />}
							cellRenderer={(props) => <RowHeaders {...props} />}
							style={{ margin: 0 }}
						/>
						{renderColumns(columns, cellRendererCallback, widths)}
						{visibleColumns && renderBlankColumns(visibleColumns, columns, blankColumnWidth, cellRendererCallback)}
					</Table>
				)}
			</AutoSizer>
		</div>
	);
});

function renderColumns(columns, cellRendererCallback, widths) {
	return columns.map((column, columnIndex) => (
		<Column
			key={columnIndex}
			cellRenderer={cellRendererCallback(column)}
			columnIndex={columnIndex}
			dataKey={(column && column.id) || ''}
			headerRenderer={(props) => (
				<HeaderRenderer {...props} column={column} columnIndex={columnIndex} units={column && column.units} />
			)}
			label={(column && column.label) || ''}
			width={widths[column.id] || 100}
			style={{
				border: '1px solid #ddd',
				borderLeft: columnIndex === 0 ? '1 px solid #ddd' : 'none',
				margin: 0,
			}}
		/>
	));
}

function renderBlankColumns(totalColumnCount, columns, blankColumnWidth, cellRendererCallback) {
	const columnContainer = [];
	for (let columnIndex = columns.length - 1; columnIndex < totalColumnCount; columnIndex++) {
		columnContainer.push(
			<Column
				key={columnIndex}
				cellRenderer={cellRendererCallback(null)}
				columnIndex={columnIndex}
				dataKey={''}
				headerRenderer={(props) => <HeaderRenderer {...props} columnIndex={columnIndex} />}
				label={''}
				width={blankColumnWidth}
				style={{
					border: '1px solid #ddd',
					borderLeft: columnIndex === 0 ? '1 px solid #ddd' : 'none',
					margin: 0,
				}}
			/>,
		);
	}
	return columnContainer;
}
