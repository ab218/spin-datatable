import React from 'react';
import './App.css';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import AnalysisModal from './ModalAnalysis';
import ActiveCell from './ActiveCell';
import ColResizer from './ColResizer';
import ContextMenu from './ContextMenu';
import ColumnTypeModal from './ModalColumnType';
import Row from './Row';
import { SelectedCell } from './Cell';
import {
  ACTIVATE_CELL,
  ADD_CURRENT_SELECTION_TO_CELL_SELECTIONS,
  CREATE_COLUMNS,
  CREATE_ROWS,
  MODIFY_CURRENT_SELECTION_CELL_RANGE,
  SELECT_CELL,
  TOGGLE_CONTEXT_MENU,
  UPDATE_CELL,
} from './constants'
import HighchartsDemo from './HighchartsDemo';

function FormulaBar() {
  return (
    <div style={{display: 'flex', height: '30px'}}>
      <div style={{minWidth: '82px', margin: 'auto', fontStyle: 'italic'}}>Fx</div>
      <input style={{width: '100%', fontSize: '1.2em'}} />
    </div>
  )
}

function BlankRow({cellCount}) { return <tr>{Array(cellCount).fill(undefined).map((_, columnIndex) => <td style={{backgroundColor: '#f9f9f9'}} key={'blankcol' + columnIndex}></td>)}</tr> }

function BlankClickableRow({
  activeCell,
  cellCount,
  changeActiveCell,
  columns,
  createNewColumns,
  createNewRows,
  finishCurrentSelectionRange,
  isSelectedCell,
  modifyCellSelectionRange,
  numberOfRows,
  rowIndex,
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
        // REPEATED FUNCTION DECLARATION BELOW
        function updateCell(event) {
          if (rows === 1 ) {
            createNewRows(rows);
          }
          if (columnIndex > columns.length) {
            createNewColumns(columnIndex - columns.length);
          }
          dispatchSpreadsheetAction({type: UPDATE_CELL, row: null, column, cellValue: event.target.value});
        }
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
              numberOfRows={numberOfRows}
              rowIndex={rowIndex}
              rows={rows}
              updateCell={updateCell}
            />
          )
        } else if (column && isSelectedCell(rowIndex, columnIndex)) {
          return (
            <SelectedCell
              key={`Row${rowIndex}Col${columnIndex}`}
              isFormulaColumn={isFormulaColumn}
              changeActiveCell={changeActiveCell}
              column={column}
              columnIndex={columnIndex}
              finishCurrentSelectionRange={finishCurrentSelectionRange}
              modifyCellSelectionRange={modifyCellSelectionRange}
              numberOfRows={numberOfRows}
              rowIndex={rowIndex}
              updateCell={updateCell}
            />
          )
        }
        return (
          <td
            onMouseDown={(event) => {
              event.preventDefault();
              if (contextMenuOpen) {
                dispatchSpreadsheetAction({type: TOGGLE_CONTEXT_MENU, contextMenuOpen: 'hide' })
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
            ></td>
        )
      })}
    </tr>
  );
}

function Spreadsheet({eventBus}) {
  const {
    activeCell,
    columnPositions,
    columns,
    cellSelectionRanges,
    currentCellSelectionRange,
    rowPositions,
    rows,
    selectedColumn
   } = useSpreadsheetState();
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();

  // const [analysisWindow, setAnalysisWindow] = useState(false);

  function isSelectedCell(row, column) {
    function withinRange(value) {
      const {top, right, bottom, left} = value;
      return row >= top && row <= bottom && column >= left && column <= right;
    }
    const withinASelectedRange = cellSelectionRanges.some(withinRange);
    return withinASelectedRange || (currentCellSelectionRange && withinRange(currentCellSelectionRange));
  }

  const rowMap = Object.entries(rowPositions).reduce((acc, [id, position]) => {
    return {...acc, [position]: id};
  }, {});
  const rowCount = rowMap ? Math.max(...Object.keys(rowMap)) + 1 : 0;
  const visibleRowCount = Math.max(rowCount, 20); // 50 rows should be enough to fill the screen
  const rowIDs = Array(rowCount).fill(undefined).map((_, index) => {
    return rowMap[index];
  });

  // We add one more column header as the capstone for the column of row headers
  const visibleColumnCount = Math.max(26, columns.length);
  const headers = Array(visibleColumnCount).fill(undefined).map((_, index) => (
    <ColResizer
      columnIndex={index}
      key={index}
      minWidth={60}
      column={columns[index]}
      content={String.fromCharCode(index + 'A'.charCodeAt(0))}
    />
  ))
  const visibleRows = Array(visibleRowCount).fill(undefined).map((_, index) => {
      if (rowIDs[index]) {
        return (
          <Row
            key={'Row' + index}
            activeCell={activeCell}
            cellCount={visibleColumnCount + 1}
            changeActiveCell={changeActiveCell}
            columnPositions={columnPositions}
            columns={columns}
            createNewColumns={createNewColumns}
            createNewRows={createNewRows}
            finishCurrentSelectionRange={finishCurrentSelectionRange}
            isSelectedCell={isSelectedCell}
            modifyCellSelectionRange={modifyCellSelectionRange}
            numberOfRows={rowCount}
            row={rows.find(({id}) => id === rowIDs[index])}
            rowIDs={rowIDs}
            rowIndex={index}
            rows={index - rowCount + 1}
            selectCell={selectCell}
          />
        )
      } else if (rowIDs[index-1]) {
        return (
          <BlankClickableRow
            key={'Row' + index}
            cellCount={visibleColumnCount + 1}
            activeCell={activeCell}
            changeActiveCell={changeActiveCell}
            columns={columns}
            createNewRows={createNewRows}
            createNewColumns={createNewColumns}
            finishCurrentSelectionRange={finishCurrentSelectionRange}
            isSelectedCell={isSelectedCell}
            modifyCellSelectionRange={modifyCellSelectionRange}
            numberOfRows={rowCount}
            rowIndex={index}
            rows={index - rowCount + 1}
            selectCell={selectCell}
          />
        )
      } else { return <BlankRow key={'BlankRow' + index} cellCount={visibleColumnCount + 1} />}
  });

  function createNewRows(rowCount) {
    dispatchSpreadsheetAction({type: CREATE_ROWS, rowCount});
  }

  function createNewColumns(columnCount) {
    dispatchSpreadsheetAction({type: CREATE_COLUMNS, columnCount});
  }

  function changeActiveCell(row, column, selectionActive) {
    dispatchSpreadsheetAction({type: ACTIVATE_CELL, row, column, selectionActive});
  }

  function selectCell(row, column, selectionActive) {
    dispatchSpreadsheetAction({type: SELECT_CELL, row, column, selectionActive});
  }

  function modifyCellSelectionRange(row, col) {
    dispatchSpreadsheetAction({type: MODIFY_CURRENT_SELECTION_CELL_RANGE, endRangeRow: row, endRangeColumn: col});
  }

  function finishCurrentSelectionRange() {
    dispatchSpreadsheetAction({type: ADD_CURRENT_SELECTION_TO_CELL_SELECTIONS});
  }

  return (
    <div>
      <ContextMenu />
      <HighchartsDemo />
      {selectedColumn && <ColumnTypeModal selectedColumn={selectedColumn}/>}
      <AnalysisModal />
      <FormulaBar />
      <table>
        <thead><tr><td></td>{headers}</tr></thead>
        <tbody>{visibleRows}</tbody>
      </table>
    </div>
  );
}

export default Spreadsheet;
