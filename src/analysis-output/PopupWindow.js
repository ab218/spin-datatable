import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

export default function Popout({ title, id, setPopup, windowWidth, ...props }) {
	const [ containerElement, setContainerElement ] = useState(null);
	function closeWindow() {
		setPopup((prev) => prev.filter((pop) => pop.id !== id));
	}
	useEffect(
		() => {
			const features = `left=9999,top=100,width=${windowWidth},height=850`;
			const externalWindow = window.open('', id, features);
			const stylesheets = Array.from(document.styleSheets);
			stylesheets.forEach((stylesheet) => {
				const css = stylesheet;
				if (stylesheet.href) {
					const newStyleElement = document.createElement('link');
					newStyleElement.rel = 'stylesheet';
					newStyleElement.href = stylesheet.href;
					externalWindow.document.head.appendChild(newStyleElement);
				} else if (css && css.cssRules && css.cssRules.length > 0) {
					const newStyleElement = document.createElement('style');
					Array.from(css.cssRules).forEach((rule) => {
						newStyleElement.appendChild(document.createTextNode(rule.cssText));
					});
					externalWindow.document.head.appendChild(newStyleElement);
				}
			});

			if (externalWindow) {
				const containerElement = externalWindow.document.createElement('div');
				containerElement.setAttribute('id', 'portal-root');
				externalWindow.document.body.appendChild(containerElement);
				externalWindow.document.title = title;
				setContainerElement(containerElement);

				// Make sure the window closes when the component unloads
				externalWindow.addEventListener('beforeunload', () => {
					closeWindow();
				});
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	// Render this component's children into the root element of the popout window
	return containerElement ? ReactDOM.createPortal(props.children, containerElement) : null;
}
