import EventBus from './eventbus';
import * as eventConstants from './constants';
function handlingTableEvent(data) {
	// chrome.runtime.sendMessage({});
	// console.log('data:', data);
}
const eventBus = new EventBus(
	'spreadsheet-events',
	//  console.debug
);
console.log('event bus created');
Object.keys(eventConstants).forEach((event) => {
	eventBus.subscribe(event, handlingTableEvent);
});

export default eventBus;
