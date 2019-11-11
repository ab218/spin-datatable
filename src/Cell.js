import React, {useEffect} from 'react';
import { useSpreadsheetDispatch, useSpreadsheetState } from './SpreadsheetProvider';
import {
  ACTIVATE_CELL,
  CLOSE_CONTEXT_MENU,
  COPY_VALUES,
  DELETE_VALUES,
  PASTE_VALUES,
  TRANSLATE_SELECTED_CELL,
  UPDATE_CELL
  } from './constants'
import { formatForNumberColumn } from './Spreadsheet';
import { Tooltip } from 'antd';
import './App.css';

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
  const { contextMenuOpen, cellSelectionRanges, columnPositions, rowPositions, rows: stateRows } = useSpreadsheetState();
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
      if (event.metaKey) {
        if (event.key === 'c') {
          dispatchSpreadsheetAction({type: COPY_VALUES});
          return;
        } else if (event.key === 'v') {
          console.log('pasted')
          function updateKeyReducer(container, key) {
            const {[key]: value, ...rest} = container;
            console.log('container :', container, 'key: ', key, 'value: ', value, 'rest: ', rest)
            return rest;
          }
          async function paste(input) {
            const clipText = await navigator.clipboard.readText();
            const clipTextRows = clipText.split('\n').slice(1);
            const clipText2dArray = clipTextRows.map(clipRow => clipRow.split('\t'));
            const { top, left } = cellSelectionRanges[0];
            const arrayDimensions = {height: clipText2dArray.length, width:clipText2dArray[0].length};
            // console.log('top left: ', top + 1, left);
            // console.log('number of rows:', stateRows.length);
            // console.log('rows', rows);
            // console.log('height: ', arrayDimensions.height)
            if ((arrayDimensions.height - 1 + rows) > 0) {
              createNewRows(arrayDimensions.height - 1 + rows);
            }
            if ((left - 1 + arrayDimensions.width - columns.length) > 0) {
              createNewColumns((left - 1 + arrayDimensions.width - columns.length));
            }
        }
          paste()
          dispatchSpreadsheetAction({type: PASTE_VALUES});
          return;
        }
      }
      // if the key pressed is not a non-character key (arrow key etc)
      if (!isFormulaColumn && event.key.length === 1) {
          if (rows > 1 ) {
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

  function onMouseDown(event) {
    if (contextMenuOpen) {
      dispatchSpreadsheetAction({type: CLOSE_CONTEXT_MENU })
    }
    if (!isFormulaColumn && event.button === 0) {
      changeActiveCell(rowIndex, columnIndex, event.ctrlKey || event.shiftKey || event.metaKey);
    }
  }

  function onMouseEnter(event) {
    if (typeof event.buttons === 'number' && event.buttons > 0) {
      modifyCellSelectionRange(rowIndex, columnIndex, true);
    }
  }

  return (
    <td
      key={`row${rowIndex}col${columnIndex}`}
      style={{backgroundColor:'#C0C0C0'}}
      onContextMenu={handleContextMenu}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseUp={finishCurrentSelectionRange}
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

  function onMouseDown(event) {
    // prevent text from being highlighted on drag select cells
    event.preventDefault();
    if (contextMenuOpen) {
      dispatchSpreadsheetAction({type: CLOSE_CONTEXT_MENU });
    }
    selectCell(rowIndex, columnIndex, event.ctrlKey || event.shiftKey || event.metaKey);
  }

  function onMouseEnter(event) {
    if (typeof event.buttons === 'number' && event.buttons > 0) {
      modifyCellSelectionRange(rowIndex, columnIndex, true);
    }
  }

  return (
    formatForNumberColumn(cellValue, column)
      ? <Tooltip title={`Cell value is not a number`}>
          <td
          className='NaN-value'
          key={`row${rowIndex}col${columnIndex}`}
          onMouseDown={onMouseDown}
          onMouseEnter={onMouseEnter}
          onMouseUp={finishCurrentSelectionRange}
          >
            {cellValue || '\u2022'}
          </td>
        </Tooltip>
      : <td
        key={`row${rowIndex}col${columnIndex}`}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseUp={finishCurrentSelectionRange}
        >
          {cellValue || '\u2022'}
        </td>
  )}
