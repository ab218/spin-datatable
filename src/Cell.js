import React, {useEffect} from 'react';
import { useSpreadsheetDispatch } from './SpreadsheetProvider';
import { DELETE_VALUES, TRANSLATE_SELECTED_CELL, ACTIVATE_CELL } from './constants'

export function RowNumberCell({rowIndex}) { return <td>{rowIndex + 1}</td> }

export function SelectedCell({
  changeActiveCell,
  column,
  columnIndex,
  formulaResult,
  finishCurrentSelectionRange,
  isFormulaColumn,
  modifyCellSelectionRange,
  numberOfRows,
  row,
  rowIndex,
  updateCell,
} ) {
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();

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
      if (!formulaResult && !isFormulaColumn && event.key.length === 1) {
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
        if (!formulaResult && !isFormulaColumn) {
          changeActiveCell(rowIndex, columnIndex, event.ctrlKey || event.shiftKey || event.metaKey);
        }
      }}
      onMouseEnter={(event) => {
        if (typeof event.buttons === 'number' && event.buttons > 0) {
          modifyCellSelectionRange(rowIndex, columnIndex, true);
        }
      }}
      onMouseUp={() => {finishCurrentSelectionRange()}}
    >{formulaResult || (row && column ? row[column.id] : '')}</td>
  )
}

export function NormalCell({
  column,
  columnIndex,
  finishCurrentSelectionRange,
  formulaResult,
  modifyCellSelectionRange,
  row,
  rowIndex,
  selectCell,
}) {
  const cellValue = row[column.id];
  return (
  <td
    key={`row${rowIndex}col${columnIndex}`}
    onMouseDown={(event) => {
      // prevent text from being highlighted
      event.preventDefault();
      selectCell(rowIndex, columnIndex, event.ctrlKey || event.shiftKey || event.metaKey);
    }}
    onMouseEnter={(event) => {
      if (typeof event.buttons === 'number' && event.buttons > 0) {
        modifyCellSelectionRange(rowIndex, columnIndex, true);
      }
    }}
    onMouseUp={() => {finishCurrentSelectionRange()}}
    >
  {formulaResult || cellValue}</td>
  )}


// function Cell({value, formulaParser, row, col, deselected, selected, setActiveCell, modifyCellSelectionRange, finishCurrentSelectionRange}) {
//   const dispatchSpreadsheetAction = useSpreadsheetDispatch();
//   let cellValue = value;
//   if (isFormula(cellValue)) {
//     const {error, result} = formulaParser.parse(cellValue.slice(1));
//     cellValue = error || result;
//   }
//   return (<td style={!deselected && selected ? {backgroundColor: '#f0f0f0'} : {}}
//               onMouseDown={(event) => {
//                 if (selected) {
//                   setActiveCell(row, col, event.ctrlKey || event.shiftKey || event.metaKey);
//                   dispatchSpreadsheetAction({type: 'add-cell-to-deselect-list'});
//                 } else {
//                   setActiveCell(row, col, event.ctrlKey || event.shiftKey || event.metaKey);
//                 }
//                 if (!event.metaKey && !event.shiftKey) {
//                   dispatchSpreadsheetAction({type: 'clear-deselect-list'});
//                 }
//               }}
//               onMouseMove={(event) => {
//                 if (typeof event.buttons === 'number' && event.buttons > 0) {
//                   modifyCellSelectionRange(row, col, true);
//                 }
//               }}
//               onMouseUp={() => {
//                 finishCurrentSelectionRange();
//               }}>{cellValue}</td>);
// }

// export default Cell;