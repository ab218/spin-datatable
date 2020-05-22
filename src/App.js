import React from 'react';
import './App.css';
import Spreadsheet from './Spreadsheet';
import { SpreadsheetProvider } from './SpreadsheetProvider';
// import eventBus from './EventBusSubscriptions.js';

function App() {
	return (
		<div style={{ height: '100%' }} className="App">
			<SpreadsheetProvider>
				<Spreadsheet />
			</SpreadsheetProvider>
		</div>
	);
}

export default App;
