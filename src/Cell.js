import React, {useEffect} from 'react';
import { useSpreadsheetDispatch, useSpreadsheetState } from './SpreadsheetProvider';
import { DELETE_VALUES, TRANSLATE_SELECTED_CELL, ACTIVATE_CELL, TOGGLE_CONTEXT_MENU } from './constants'

export function RowNumberCell({rowIndex}) { return <td>{rowIndex + 1}</td> }

export function SelectedCell({
  changeActiveCell,
  column,
  columnIndex,
  finishCurrentSelectionRange,
  isFormulaColumn,
  modifyCellSelectionRange,
  numberOfRows,
  row,
  rowIndex,
  updateCell,
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
        dispatchSpreadsheetAction({type: ACTIVATE_CELL, row: rowIndex, column: columnIndex});
        updateCell(event, true);
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
      style={{backgroundColor: '#f0f0f0'}}
      onMouseDown={(event) => {
        if (contextMenuOpen) {
          dispatchSpreadsheetAction({type: TOGGLE_CONTEXT_MENU, contextMenuOpen: 'hide' })
        }
        if (!isFormulaColumn) {
          changeActiveCell(rowIndex, columnIndex, event.ctrlKey || event.shiftKey || event.metaKey);
        }
      }}
      onMouseEnter={(event) => {
        if (typeof event.buttons === 'number' && event.buttons > 0) {
          modifyCellSelectionRange(rowIndex, columnIndex, true);
        }
      }}
      onMouseUp={() => {finishCurrentSelectionRange()}}
    >{(row && column ? row[column.id] : '')}</td>
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
    >
  {cellValue}</td>
  )}
