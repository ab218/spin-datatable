import React from 'react';
import { useSpreadsheetDispatch } from './SpreadsheetProvider';

function isFormula(value) {
  return typeof value === 'string' && value.charAt(0) === '=';
}

function Cell({value, formulaParser, row, col, deselected, selected, setActiveCell, modifyCellSelectionRange, finishCurrentSelectionRange}) {
  const dispatchSpreadsheetAction = useSpreadsheetDispatch();
  let cellValue = value;
  if (isFormula(cellValue)) {
    const {error, result} = formulaParser.parse(cellValue.slice(1));
    cellValue = error || result;
  }
  return (<td style={!deselected && selected ? {backgroundColor: '#f0f0f0'} : {}}
              onMouseDown={(event) => {
                if (selected) {
                  setActiveCell(row, col, event.ctrlKey || event.shiftKey || event.metaKey);
                  dispatchSpreadsheetAction({type: 'add-cell-to-deselect-list'});
                } else {
                  setActiveCell(row, col, event.ctrlKey || event.shiftKey || event.metaKey);
                }
                if (!event.metaKey && !event.shiftKey) {
                  dispatchSpreadsheetAction({type: 'clear-deselect-list'});
                }
              }}
              onMouseMove={(event) => {
                if (typeof event.buttons === 'number' && event.buttons > 0) {
                  modifyCellSelectionRange(row, col, true);
                }
              }}
              onMouseUp={() => {
                finishCurrentSelectionRange();
              }}>{cellValue}</td>);
}

export default Cell;