import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

export default function Popout({ title, id, setPopup, ...props }) {
	const [ containerElement, setContainerElement ] = useState(null);

	function closeWindow() {
		setPopup((prev) => prev.filter((pop) => pop.id !== id));
	}
	useEffect(
		() => {
			console.log('mount');
			const features = 'left=9999,top=100,width=800,height=850';
			const externalWindow = window.open('', id, features);

			let containerElement = null;
			if (externalWindow) {
				containerElement = externalWindow.document.createElement('div');
				externalWindow.document.body.appendChild(containerElement);
				externalWindow.document.title = title;

				// Make sure the window closes when the component unloads
				externalWindow.addEventListener('beforeunload', () => {
					console.log('called beforeunload');
					closeWindow();
				});
			}
			setContainerElement(containerElement);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	// Render this component's children into the root element of the popout window
	return containerElement ? ReactDOM.createPortal(props.children, containerElement) : null;
}
