import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import EventBus from './eventbus.js';

const eventBus = new EventBus('spreadsheet-events', console.debug);
eventBus.subscribe('select-cell', function handlingCellSelection() {
  console.log('handling cell selection:', arguments);
});

ReactDOM.render(<App eventBus={eventBus} />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
