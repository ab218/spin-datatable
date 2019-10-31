import React, {useEffect} from 'react';
import { useSpreadsheetDispatch, useSpreadsheetState } from './SpreadsheetProvider';
import { CLOSE_CONTEXT_MENU, DELETE_VALUES, TRANSLATE_SELECTED_CELL, ACTIVATE_CELL, UPDATE_CELL  } from './constants'
import { formatForNumberColumn } from './Spreadsheet';

export function RowNumberCell({rowIndex}) { return <td>{rowIndex + 1}</td> }

export function SelectedCell({
  changeActiveCell,
  column,
  columns,
  columnIndex,
  finishCurrentSelectionRange,
  handleContextMenu,
  isFormulaColumn,
  modifyCellSelectionRange,
  numberOfRows,
  row,
  rows,
  rowIndex,
  createNewRows,
  createNewColumns
} ) {
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();
  const { contextMenuOpen } = useSpreadsheetState();
  const cursorKeyToRowColMapper = {
    ArrowUp: function (row, column) {
      // rows should never go less than index 0 (top row header)
      return {row: Math.max(row - 1, 0), column};
    },
    ArrowDown: function (row, column, numberOfRows) {
      return {row: Math.min(row + 1, numberOfRows), column};
    },
    ArrowLeft: function (row, column) {
      // Column should be minimum of 1 due to side row header
      return {row, column: Math.max(column - 1, 1)};
    },
    ArrowRight: function (row, column) {
      return {row, column: column + 1};
    }
  };

  useEffect(() => {
    function onKeyDown(event) {
      // if the key pressed is not a non-character key (arrow key etc)
      if (!isFormulaColumn && event.key.length === 1) {
          if (rows === 1 ) {
            createNewRows(rows);
          }
          if (columnIndex > columns.length) {
            createNewColumns(columnIndex - columns.length);
          }
          dispatchSpreadsheetAction({type: UPDATE_CELL, row, column, cellValue: event.key});
          dispatchSpreadsheetAction({type: 'DISABLE_SELECT'});
          dispatchSpreadsheetAction({type: ACTIVATE_CELL, row: rowIndex, column: columnIndex});
      } else {
        switch (true) {
          case Object.keys(cursorKeyToRowColMapper).includes(event.key):
            event.preventDefault();
            const { row, column } = cursorKeyToRowColMapper[event.key](rowIndex, columnIndex, numberOfRows);
            dispatchSpreadsheetAction({type: TRANSLATE_SELECTED_CELL, rowIndex: row, columnIndex: column});
            break;
          case event.key === 'Backspace':
            dispatchSpreadsheetAction({type: DELETE_VALUES});
            break;
          default:
            break;
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  })

  return (
    <td
      key={`row${rowIndex}col${columnIndex}`}
      style={{backgroundColor: 	'#C0C0C0'}}
      onContextMenu={e => handleContextMenu(e)}
      onMouseDown={(event) => {
        if (contextMenuOpen) {
          dispatchSpreadsheetAction({type: CLOSE_CONTEXT_MENU })
        }
        if (!isFormulaColumn && event.button === 0) {
          changeActiveCell(rowIndex, columnIndex, event.ctrlKey || event.shiftKey || event.metaKey);
        }
      }}
      onMouseEnter={(event) => {
        if (typeof event.buttons === 'number' && event.buttons > 0) {
          modifyCellSelectionRange(rowIndex, columnIndex, true);
        }
      }}
      onMouseUp={() => {finishCurrentSelectionRange()}}
    >{(row && column ? formatForNumberColumn(row[column.id], column) : '')}</td>
  )
}

export function NormalCell({
  column,
  columnIndex,
  finishCurrentSelectionRange,
  modifyCellSelectionRange,
  row,
  rowIndex,
  selectCell,
}) {
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();
  const { contextMenuOpen } = useSpreadsheetState();

  const cellValue = row[column.id];
  return (
    <td
    key={`row${rowIndex}col${columnIndex}`}
    onMouseDown={(event) => {
      // prevent text from being highlighted
      event.preventDefault();
      if (contextMenuOpen) {
        dispatchSpreadsheetAction({type: CLOSE_CONTEXT_MENU })
      }
      selectCell(rowIndex, columnIndex, event.ctrlKey || event.shiftKey || event.metaKey);
    }}
    onMouseEnter={(event) => {
      if (typeof event.buttons === 'number' && event.buttons > 0) {
        modifyCellSelectionRange(rowIndex, columnIndex, true);
      }
    }}
    onMouseUp={finishCurrentSelectionRange}
    >
  {formatForNumberColumn(cellValue, column)}</td>
  )}
