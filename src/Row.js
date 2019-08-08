import React from 'react';
import ActiveCell from './ActiveCell';
import { NormalCell, RowNumberCell, SelectedCell } from './Cell';
import { UPDATE_CELL } from './constants';
import { useSpreadsheetDispatch } from './SpreadsheetProvider';
import { Parser } from 'hot-formula-parser';

export default function Row({
  activeCell,
  cellCount,
  columnPositions,
  columns,
  changeActiveCell,
  createNewColumns,
  createNewRows,
  finishCurrentSelectionRange,
  isSelectedCell,
  modifyCellSelectionRange,
  numberOfRows,
  row,
  rows,
  rowIndex,
  selectCell,
}) {
  columns.sort((colA, colB) => {
    return columnPositions[colA.id] - columnPositions[colB.id];
  });
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();
  return (
    <tr>
      {Array(cellCount).fill(undefined).map((_, columnIndex) => {
        const column = columns[columnIndex - 1];
        const isFormulaColumn = column && column.formula;
        if (columnIndex === 0) {
          // The row # on the left side
          return <RowNumberCell key={`RowNumberCell${rowIndex}`} rowIndex={rowIndex}/>
        }
        function updateCell(event, clear) {
          if (rows === 1 ) {
            createNewRows(rows);
          }
          if (columnIndex > columns.length) {
            createNewColumns(columnIndex - columns.length);
          }
          console.log('updating cell from active cell');
          dispatchSpreadsheetAction({type: UPDATE_CELL, row, column, cellValue: clear ? '' : event.target.value});
        }

        const formulaParser = new Parser();
        formulaParser.on('callVariable', function(name, done) {
          // console.log('callVariable callback:', arguments);
          const selectedColumn = columns.find((column) => column.id === name);
          // console.log('selectedColumn:', selectedColumn);
          if (selectedColumn) {
            done(row ? row[selectedColumn.id] : 'column not found');
          }
        });
        const formulaResult = column && column.formula ? formulaParser.parse(column.formula).result : '';
        if (activeCell && activeCell.row === rowIndex && activeCell.column === columnIndex) {
          return (
            <ActiveCell
              key={`row${rowIndex}col${columnIndex}`}
              changeActiveCell={changeActiveCell}
              column={column}
              columnIndex={columnIndex}
              columns={columns}
              createNewColumns={createNewColumns}
              createNewRows={createNewRows}
              numberOfRows={numberOfRows}
              row={row}
              rowIndex={rowIndex}
              rows={rows}
              updateCell={updateCell}
              value={column && row ? row[column.id] : ''}
            />
          )
        } else if (isSelectedCell(rowIndex, columnIndex)) {
          return (
            <SelectedCell
              key={`Row${rowIndex}Col${columnIndex}`}
              changeActiveCell={changeActiveCell}
              column={column}
              columnIndex={columnIndex}
              formulaResult={formulaResult}
              finishCurrentSelectionRange={finishCurrentSelectionRange}
              isFormulaColumn={isFormulaColumn}
              modifyCellSelectionRange={modifyCellSelectionRange}
              numberOfRows={numberOfRows}
              row={row}
              rowIndex={rowIndex}
              updateCell={updateCell}
            />
          )
        } else if (column) {
          return (
            <NormalCell
              key={`Row${rowIndex}Col${columnIndex}`}
              changeActiveCell={changeActiveCell}
              column={column}
              columnIndex={columnIndex}
              finishCurrentSelectionRange={finishCurrentSelectionRange}
              formulaResult={formulaResult}
              modifyCellSelectionRange={modifyCellSelectionRange}
              row={row}
              rowIndex={rowIndex}
              selectCell={selectCell}
            />
          )
        } else {
          // The rest of the cells in the row that aren't in a defined column
          return (<td key={`row${rowIndex}col${columnIndex}`} onClick={() => selectCell(rowIndex, columnIndex)}>.</td>)
        }
      })}
    </tr>
  );
}