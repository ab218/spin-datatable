import React, { useEffect } from 'react';
import { Parser } from 'hot-formula-parser';
import './App.css';
import Row from './Row'
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import ColResizer from './ColResizer'

function isFormula(value) {
  return typeof value === 'string' && value.charAt(0) === '=';
}

function createRandomID() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function createCell() {
  return {[createRandomID()]: {value: null}};
}

function Spreadsheet({eventBus}) {
  const {cells, activeCell, cellPositions, multiCellSelectionIDs, cellSelectionRanges, currentCellSelectionRange} = useSpreadsheetState();
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();

  function isSelectedCell(row, column) {
    function withinRange(value) {
      const {top, right, bottom, left} = value;
      return row >= top && row <= bottom && column >= left && column <= right;
    }

    const cell = cellPositions[row] && cellPositions[row][column];
    const cellIDFoundinSelection = cell && multiCellSelectionIDs.includes(cell);
    const withinASelectedRange = cellSelectionRanges.some(withinRange);
    return cellIDFoundinSelection || withinASelectedRange || (currentCellSelectionRange && withinRange(currentCellSelectionRange));
  }

  useEffect(() => {
    if (activeCell) {
      eventBus.fire('select-cell', activeCell);
    }
  }, [activeCell, eventBus]);
  useEffect(() => {
    console.log('cells updated:', cells);
  }, [cells]);
  useEffect(()  => {
    console.log('cell positions:', cellPositions);
  }, [cellPositions]);

  const formulaParser = new Parser();
  formulaParser.on('callCellValue', function(cellCoordinates, done) {
    const cellValue = cells[cellPositions[cellCoordinates.row.index][cellCoordinates.column.index]].value;
    if (isFormula(cellValue)) {
      const {error, result} = formulaParser.parse(cellValue.slice(1));
      done(error || result);
    } else {
      done(cellValue);
    }
  });

  formulaParser.on('callRangeValue', function(startCellCoord, endCellCoord, done) {
    const data = cellPositions.slice(startCellCoord.row.index, endCellCoord.row.index + 1).map((row) => {
      return row.slice(startCellCoord.column.index, endCellCoord.column.index + 1).map((cellID) => {
        return cells[cellID].value;
      });
    });
    done(data);
  });

  const columnCount = Math.max(...(cellPositions.map((row) => row.length)));

  function changeActiveCell(row, column, selectionActive) {
    const activeCell = cellPositions[row] && cellPositions[row][column];
    if (activeCell) {
      dispatchSpreadsheetAction({type: 'activateCell', activeCell, row, column, selectionActive});
    } else if (row >= 0 && row < cellPositions.length && column >= 0 && column < columnCount) {
      // If there is no cell at the current location, create one and add its position and then activate it
      const newCell = createCell();
      const cellID = Object.keys(newCell)[0];
      // Add new cell to cell container
      dispatchSpreadsheetAction({type: 'createCell', cellID});
      dispatchSpreadsheetAction({type: 'setCellPosition', row, column, cellID});
      dispatchSpreadsheetAction({type: 'activateCell', activeCell: cellID, row, column, selectionActive});
    }
  }

  function modifyCellSelectionRange(row, col) {
    dispatchSpreadsheetAction({type: 'modify-current-selection-cell-range', endRangeRow: row, endRangeColumn: col});
  }

  function finishCurrentSelectionRange() {
    dispatchSpreadsheetAction({type: 'add-current-selection-to-cell-selections'});
  }

  // We add one more column header as the capstone for the column of row headers
  const headers = Array(columnCount + 1).fill(undefined).map((_, index) => (<ColResizer key={index} minWidth={60} content={String.fromCharCode(index - 1 + 'A'.charCodeAt(0))}/>))
  const rows = cellPositions.map((row, index) => {
    return (<Row key={index} row={row} rowIndex={index} cells={cells} finishCurrentSelectionRange={finishCurrentSelectionRange} modifyCellSelectionRange={modifyCellSelectionRange}
       activeCell={activeCell} setActiveCell={changeActiveCell} isSelectedCell={isSelectedCell} formulaParser={formulaParser}/>)
  });
  return (
    <table>
      <thead><tr>{headers}</tr></thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

export default Spreadsheet;
