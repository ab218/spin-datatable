import React, {useState} from 'react';
import {Parser} from 'hot-formula-parser';
import './App.css';

function isFormula(value) {
  return typeof value === 'string' && value.charAt(0) === '=';
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
    done(cells[cellPositions[cellCoordinates.row.index][cellCoordinates.column.index]].value);
  });



  const rows = cellPositions.map((row, index) => {
    return (<tr key={'row' + index}>{row.map((cell) => {
      let cellValue = cells[cell].value;
      if (isFormula(cellValue)) {
        const {error, result} = formulaParser.parse(cellValue.slice(1));
        cellValue = result;
      }
    return (<td contentEditable="true" key={cell} onBlur={(event) => {
      console.log("hello i'm being changed" , event.target.textContent);
      setCells({...cells, [cell]: {value: Number(event.target.textContent)}})
    }}>{cellValue}</td>);
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
