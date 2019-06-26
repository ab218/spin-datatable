import React from 'react';

function isFormula(value) {
  return typeof value === 'string' && value.charAt(0) === '=';
}

function Cell({value, formulaParser, row, col, selected, setActiveCell, modifyCellSelectionRange, finishCurrentSelectionRange}) {
  let cellValue = value;
  if (isFormula(cellValue)) {
    const {error, result} = formulaParser.parse(cellValue.slice(1));
    cellValue = error || result;
  }
  return (<td style={selected ? {backgroundColor: 'blue'} : {}}
              onMouseDown={(event) => {
                console.log('mousedown event:', event);
                setActiveCell(row, col, event.ctrlKey || event.shiftKey || event.metaKey);
              }}
              onMouseMove={(event) => {
                console.log('mousemove event:', event);
                modifyCellSelectionRange(row, col, true);
              }}
              onMouseUp={(event) => {
                console.log('mouse up event:', event);
                finishCurrentSelectionRange();
              }}>{cellValue}</td>);
}

export default Cell;