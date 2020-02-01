/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useEffect, useState } from 'react';
import {
	useSpreadsheetDispatch,
	// useSpreadsheetState
} from './SpreadsheetProvider';
import { UPDATE_CELL } from './constants';

export default function ActiveCell({ columnIndex, rows, createNewRows, handleContextMenu, rowIndex, value }) {
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();

	// const inputEl = useRef(null);
	// useEffect(() => {
	// 	const oldInputElCurrent = inputEl.current;
	// 	// Sometimes focus wasn't firing so I added a short setTimeout here
	// 	setTimeout(() => {
	// 		oldInputElCurrent.focus();
	// 		if (!selectDisabled) {
	// 			oldInputElCurrent.select();
	// 		}
	// 	}, 5);
	// 	dispatchSpreadsheetAction({ type: 'ENABLE_SELECT' });
	// 	// eslint-disable-next-line react-hooks/exhaustive-deps
	// }, []);

	const [ currentValue, setCurrentValue ] = useState(value || '');
	const [ oldValue, setOldValue ] = useState(value);
	const inputRef = useRef(null);

	useEffect(() => {
		const oldInputRef = inputRef.current;
		setTimeout(() => {
			oldInputRef.focus();
		}, 5);
	}, []);

	useEffect(
		() => {
			if (currentValue && currentValue !== oldValue) {
				if (rowIndex + 1 > rows.length) {
					createNewRows(rowIndex + 1 - rows.length);
				}
				dispatchSpreadsheetAction({
					type: UPDATE_CELL,
					rowIndex,
					columnIndex: columnIndex - 1,
					cellValue: currentValue,
				});
				setOldValue(currentValue);
			}
		},
		[ currentValue ],
	);

	return (
		<div style={{ height: '100%', width: '100%' }} onContextMenu={(e) => handleContextMenu(e)}>
			<input
				ref={inputRef}
				type="text"
				style={{ height: '100%', width: '100%' }}
				value={currentValue}
				onChange={(e) => {
					e.preventDefault();
					setCurrentValue(e.target.value);
				}}
			/>
		</div>
	);
}
