import React, { useEffect, useState, useRef } from 'react';

export default function BuildTitle({ children }) {
	const [ modalDom, setModalDom ] = useState(null);

	const updateTransform = (transformStr) => {
		modalDom.style.transform = transformStr;
	};

	useEffect(() => {
		setModalDom(document.getElementsByClassName('ant-modal-wrap')[0]);
	}, []);

	return (
		<DragM updateTransform={updateTransform}>
			<div>{children}</div>
		</DragM>
	);
}

function DragM(props) {
	const tdom = useRef(null);
	const position = useRef({
		startX: 0,
		startY: 0,
		dx: 0,
		dy: 0,
	});
	const docMove = (event) => {
		const tx = event.pageX - position.current.startX;
		const ty = event.pageY - position.current.startY;
		const transformStr = `translate(${tx}px,${ty}px)`;
		props.updateTransform(transformStr);
		position.current = {
			...position.current,
			dx: tx,
			dy: ty,
		};
	};

	const start = (event) => {
		if (event.button !== 0) {
			return;
		}
		document.addEventListener('mousemove', docMove);
		position.current = {
			...position.current,
			startX: event.pageX - position.current.dx,
			startY: event.pageY - position.current.dy,
		};
	};

	const docMouseUp = () => {
		document.removeEventListener('mousemove', docMove);
	};

	useEffect(() => {
		const current = tdom.current;
		current.addEventListener('mousedown', start);
		document.addEventListener('mouseup', docMouseUp);
		return () => {
			current.removeEventListener('mousedown', start);
			document.removeEventListener('mouseup', docMouseUp);
			document.removeEventListener('mousemove', docMove);
		};
	});

	const { children } = props;
	const newStyle = { ...children.props.style, cursor: 'move', userSelect: 'none' };
	return React.cloneElement(React.Children.only(children), {
		ref: tdom,
		style: newStyle,
	});
}
