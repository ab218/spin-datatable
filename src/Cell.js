import React from 'react';

function isFormula(value) {
  return typeof value === 'string' && value.charAt(0) === '=';
}

function Cell({value, formulaParser, row, col, setActiveCell}) {
  let cellValue = value;
  if (isFormula(cellValue)) {
    const {error, result} = formulaParser.parse(cellValue.slice(1));
    cellValue = error || result;
  }
  return (<td onClick={(event) => setActiveCell(row, col)}>{cellValue}</td>);
}

export default Cell;