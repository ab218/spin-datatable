import React from 'react';

function isFormula(value) {
  return typeof value === 'string' && value.charAt(0) === '=';
}

function Cell({value, formulaParser, row, col, selected, setActiveCell}) {
  let cellValue = value;
  if (isFormula(cellValue)) {
    const {error, result} = formulaParser.parse(cellValue.slice(1));
    cellValue = error || result;
  }
  return (<td style={selected ? {backgroundColor: 'blue'} : {}} onClick={() => setActiveCell(row, col)}>{cellValue}</td>);
}

export default Cell;