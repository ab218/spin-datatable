import React, {useState} from 'react';
import {Parser} from 'hot-formula-parser';
import './App.css';

function isFormula(value) {
  return typeof value === 'string' && value.charAt(0) === '=';
}

function translateRowColToPosition(coordinates) {
  const col = coordinates.charCodeAt(0) - 'A'.charCodeAt(0);
  const row = Number(coordinates.slice(1)) - 1;
  return [row, col];
}

function App() {
  const [cells, setCells] = useState({
    xgi6v: {value: 1},
    dhsu6: {value: 1},
    h1rdx: {value: 1},
    paiov: {value: 1},
    y344s: {value: 1},
    xnnul: {value: 1},
    ohl7r: {value: 1},
    y8ol9: {value: 1},
    lkaq0: {value: 1},
    apq6f: {value: 1},
    isd8w: {value: 1},
    d7uj1: {value: 1},
    npdt9: {value: 1},
    tae9a: {value: 1},
    aj9fm: {value: '=A1+A2'},
  });
  const [cellPositions, setCellPositions] = useState([
    ['xgi6v', 'dhsu6', 'h1rdx', 'paiov', 'y344s'],
    ['xnnul', 'ohl7r', 'y8ol9', 'lkaq0', 'apq6f'],
    ['isd8w', 'd7uj1', 'npdt9', 'tae9a', 'aj9fm']
  ]);

  const formulaParser = new Parser();
  formulaParser.on('callCellValue', function(cellCoordinates, done) {
    console.log('cellCoordinates:', cellCoordinates, cellPositions[cellCoordinates.row.index][cellCoordinates.column.index]);
    // const [row, col] = translateRowColToPosition(cellCoordinates);
    // console.log('row:', row, 'col:', col);
    done(cells[cellPositions[cellCoordinates.row.index][cellCoordinates.column.index]].value);
  });

  console.log('inside App function');
  const rows = cellPositions.map((row, index) => {
    return (<tr key={'row' + index}>{row.map((cell) => {
      let cellValue = cells[cell].value;
      if (isFormula(cellValue)) {
        console.log('formula:', cellValue);
        const {error, result} = formulaParser.parse(cellValue.slice(1));
        console.log('error:', error);
        cellValue = result;
      }
      console.log('cell', cell, 'cellValue:', cellValue);
    return (<td key={cell}>{cell} - {cellValue} <button onClick={() => setCells({...cells, [cell]: {value: cellValue + 1}})}>
    Add 1
  </button></td>);
    })}</tr>);
  });
  return (
    <div className="App">
        <table>
          <tbody>{rows}</tbody>
        </table>
    </div>
  );
}

export default App;
