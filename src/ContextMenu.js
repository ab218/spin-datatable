import React, { useEffect } from 'react';
import { useSpreadsheetState, useSpreadsheetDispatch } from './SpreadsheetProvider';
import {
	CLOSE_CONTEXT_MENU,
	COPY_VALUES,
	REMOVE_SELECTED_CELLS,
	// SET_GROUPED_COLUMNS,
	SORT_COLUMN,
	TOGGLE_COLUMN_TYPE_MODAL,
	// TOGGLE_LAYOUT,
	DELETE_VALUES,
} from './constants';
import { Menu } from 'antd';
import './App.css';

const { SubMenu } = Menu;

export default function ContextMenu({ paste }) {
	const {
		contextMenuType,
		colName,
		contextMenuOpen,
		contextMenuPosition,
		// layout,
		contextMenuRowIndex,
	} = useSpreadsheetState();
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();

	const onClick = (e) => {
		if (contextMenuOpen) {
			dispatchSpreadsheetAction({ type: CLOSE_CONTEXT_MENU });
		}
	};

	// const setGroupedColumns = () => {
	// 	if (!colName) return;
	// 	dispatchSpreadsheetAction({ type: REMOVE_SELECTED_CELLS });
	// 	dispatchSpreadsheetAction({ type: SET_GROUPED_COLUMNS, setColName: colName });
	// 	// layout: false is grouped (spreadsheet) view
	// 	dispatchSpreadsheetAction({ type: TOGGLE_LAYOUT, layout: false });
	// };

	useEffect(() => {
		const menu = document.querySelector('.menu');
		menu.style.display = contextMenuOpen ? 'block' : 'none';
		if (contextMenuPosition) {
			const { left, top } = contextMenuPosition;
			menu.style.left = `${left}px`;
			menu.style.top = `${top}px`;
		}
	});

	if (contextMenuType === 'column') {
		return (
			<div onClick={onClick} className="menu">
				<Menu selectable={false} style={{ width: 256 }} mode="vertical">
					<Menu.Item
						key="1"
						onClick={() =>
							dispatchSpreadsheetAction({ type: TOGGLE_COLUMN_TYPE_MODAL, columnTypeModalOpen: true, colName })}
					>
						Column Info...
					</Menu.Item>
					<Menu.Item key="4" onClick={() => dispatchSpreadsheetAction({ type: 'DELETE_COLUMN', colName })}>
						Delete Column
					</Menu.Item>
					{/* <Menu.Item key="2" onClick={setGroupedColumns}>
						Split by <span style={{ fontWeight: 'bold' }}>{colName}</span>
						<span style={{ fontStyle: 'italic' }}> (experimental)</span>
					</Menu.Item>
					{layout || (
						<Menu.Item key="3" onClick={() => dispatchSpreadsheetAction({ type: TOGGLE_LAYOUT, layout: true })}>
							Return to normal view
						</Menu.Item>
					)} */}
					<SubMenu key="sub1" title="Sort">
						<Menu.Item
							key="4"
							onClick={() => {
								dispatchSpreadsheetAction({ type: REMOVE_SELECTED_CELLS });
								dispatchSpreadsheetAction({ type: SORT_COLUMN, colName, descending: true });
							}}
						>
							Descending
						</Menu.Item>
						<Menu.Item
							key="5"
							onClick={() => {
								dispatchSpreadsheetAction({ type: REMOVE_SELECTED_CELLS });
								dispatchSpreadsheetAction({ type: SORT_COLUMN, colName, descending: false });
							}}
						>
							Ascending
						</Menu.Item>
					</SubMenu>
				</Menu>
			</div>
		);
	} else if (contextMenuType === 'row') {
		return (
			<div onClick={onClick} className="menu">
				<Menu selectable={false} style={{ width: 256 }} mode="vertical">
					<Menu.Item
						onClick={() => {
							dispatchSpreadsheetAction({ type: 'DELETE_ROW', rowIndex: contextMenuRowIndex });
						}}
						key="19"
					>
						Delete Row
					</Menu.Item>
				</Menu>
			</div>
		);
	}

	return (
		<div onClick={onClick} className="menu">
			<Menu selectable={false} style={{ width: 256 }} mode="vertical">
				<Menu.Item
					onClick={() => {
						dispatchSpreadsheetAction({ type: COPY_VALUES });
						dispatchSpreadsheetAction({ type: DELETE_VALUES });
					}}
					key="17"
				>
					Cut
				</Menu.Item>
				<Menu.Item onClick={() => dispatchSpreadsheetAction({ type: COPY_VALUES })} key="18">
					Copy
				</Menu.Item>
				<Menu.Item onClick={paste} key="19">
					Paste
				</Menu.Item>
			</Menu>
		</div>
	);
}
