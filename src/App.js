import React from 'react';
import './App.css';
import Spreadsheet from './Spreadsheet';

function App({eventBus}) {
  return (
    <div className="App">
      <Spreadsheet eventBus={eventBus}/>
    </div>
  );
}

export default App;
