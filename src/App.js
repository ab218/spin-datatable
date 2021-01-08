import React from "react";
import "./App.css";
import Spreadsheet from "./Spreadsheet";
import { SpreadsheetProvider } from "./context/SpreadsheetProvider";
require("dotenv").config();
// import eventBus from './EventBusSubscriptions.js';

console.log(process.env);

function App() {
  return (
    <div style={{ height: "100%" }} className="App">
      <SpreadsheetProvider>
        <Spreadsheet />
      </SpreadsheetProvider>
    </div>
  );
}

export default App;
