import React from 'react';
import ActiveCell from './ActiveCell';
import Cell from './Cell';
import './App.css';


function Row({row, rowIndex, cells, activeCell, setActiveCell, isSelectedCell, formulaParser, finishCurrentSelectionRange, modifyCellSelectionRange}) {
    // In case we have a shorter row of cells, create some padding to match the longest row
    // const padding = Array(emptyCellCount).fill(null);
    const rowHeader = (<td key={rowIndex}>{rowIndex + 1}</td>);
    return (<tr key={'row' + rowIndex}>{[rowHeader].concat(row.map((cell, cellIndex) => {
      let cellValue = cells[cell] && cells[cell].value;
      if (activeCell && activeCell === cell) {
        // Show a text field only in the active cell
        return (<ActiveCell key={cell} cell={cell} setActiveCell={setActiveCell} row={rowIndex} col={cellIndex} value={cellValue}/>);
      } else {
        return (<Cell key={rowIndex + '_' + cellIndex} setActiveCell={setActiveCell} finishCurrentSelectionRange={finishCurrentSelectionRange} modifyCellSelectionRange={modifyCellSelectionRange} selected={isSelectedCell(rowIndex, cellIndex)} row={rowIndex} col={cellIndex} value={cellValue} formulaParser={formulaParser}/>);
      }
    })
    )}</tr>);
}

export default Row;
