import React, { useEffect } from 'react';
import {
	useSpreadsheetState,
	useSpreadsheetDispatch,
	useSelectDispatch,
	useSelectState,
	useRowsDispatch,
	useRowsState,
} from './context/SpreadsheetProvider';
import {
	CLOSE_CONTEXT_MENU,
	COPY_VALUES,
	DELETE_COLUMN,
	DELETE_ROWS,
	DELETE_VALUES,
	EXCLUDE_ROWS,
	REMOVE_SELECTED_CELLS,
	SORT_COLUMN,
	TOGGLE_COLUMN_TYPE_MODAL,
	UNEXCLUDE_ROWS,
} from './constants';
import { Menu } from 'antd';

const { SubMenu } = Menu;

export default function ContextMenu({ paste }) {
	const {
		contextMenuType,
		colName,
		contextMenuOpen,
		contextMenuPosition,
		contextMenuRowIndex,
		// layout,
	} = useSpreadsheetState();
	const { cellSelectionRanges, uniqueRowIDs } = useSelectState();
	const { columns } = useRowsState();
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const dispatchSelectAction = useSelectDispatch();
	const dispatchRowsAction = useRowsDispatch();

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
	// TODO FIX BUG WITH DELETE COLUMN. Residual text.
	if (contextMenuType === 'column') {
		return (
			<div onClick={onClick} className="menu">
				<Menu selectable={false} style={{ width: 256 }} mode="vertical">
					<Menu.Item
						key="1"
						onClick={() =>
							dispatchSpreadsheetAction({
								type: TOGGLE_COLUMN_TYPE_MODAL,
								columnTypeModalOpen: true,
								colName,
								columns,
							})}
					>
						Column Info...
					</Menu.Item>
					<Menu.Item key="4" onClick={() => dispatchRowsAction({ type: DELETE_COLUMN, colName })}>
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
								dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
								dispatchRowsAction({ type: SORT_COLUMN, colName, descending: true });
							}}
						>
							Descending
						</Menu.Item>
						<Menu.Item
							key="5"
							onClick={() => {
								dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
								dispatchRowsAction({ type: SORT_COLUMN, colName, descending: false });
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
							dispatchRowsAction({ type: DELETE_ROWS, rowIndex: contextMenuRowIndex, uniqueRowIDs });
							dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
						}}
						key="19"
					>
						Delete Selected Rows
					</Menu.Item>
					<Menu.Item
						onClick={() => {
							dispatchRowsAction({ type: EXCLUDE_ROWS, cellSelectionRanges });
						}}
						key="20"
					>
						Exclude Selected Row(s)
					</Menu.Item>
					<Menu.Item
						onClick={() => {
							dispatchRowsAction({ type: UNEXCLUDE_ROWS, cellSelectionRanges });
						}}
						key="21"
					>
						Unexclude Selected Row(s)
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
						dispatchRowsAction({ type: COPY_VALUES, cellSelectionRanges });
						dispatchRowsAction({ type: DELETE_VALUES, cellSelectionRanges });
					}}
					key="17"
				>
					Cut
				</Menu.Item>
				<Menu.Item onClick={() => dispatchRowsAction({ type: COPY_VALUES, cellSelectionRanges })} key="18">
					Copy
				</Menu.Item>
				<Menu.Item onClick={paste} key="19">
					Paste
				</Menu.Item>
			</Menu>
		</div>
	);
}
