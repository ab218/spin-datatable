import React, { useState } from 'react';
import { Menu, Icon, Dropdown } from 'antd';
import { useSpreadsheetDispatch, useSelectDispatch } from './context/SpreadsheetProvider';
import {
	REMOVE_SELECTED_CELLS,
	TOGGLE_ANALYSIS_MODAL,
	TOGGLE_BAR_CHART_MODAL,
	TOGGLE_DISTRIBUTION_MODAL,
	TOGGLE_FILTER_MODAL,
} from './constants';

export default function HamburgerMenu() {
	const [ collapsed, setCollapsed ] = useState(false);
	const dispatchSpreadsheetAction = useSpreadsheetDispatch();
	const dispatchSelectAction = useSelectDispatch();

	const menu = (
		<Menu>
			<Menu.Item
				onClick={() => {
					dispatchSpreadsheetAction({ type: TOGGLE_DISTRIBUTION_MODAL, distributionModalOpen: true });
					dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
				}}
			>
				Distribution
			</Menu.Item>
			<Menu.Item
				onClick={() => {
					dispatchSpreadsheetAction({ type: TOGGLE_ANALYSIS_MODAL, analysisModalOpen: true });
					dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
				}}
			>
				Fit Y By X
			</Menu.Item>
			<Menu.Item onClick={() => dispatchSpreadsheetAction({ type: TOGGLE_FILTER_MODAL, filterModalOpen: true })}>
				Filter
			</Menu.Item>
			<Menu.Item
				onClick={() => {
					dispatchSpreadsheetAction({ type: TOGGLE_BAR_CHART_MODAL, barChartModalOpen: true, selectedColumns: [] });
					dispatchSelectAction({ type: REMOVE_SELECTED_CELLS });
				}}
			>
				Bar Chart
			</Menu.Item>
		</Menu>
	);

	return (
		<div style={{ textAlign: 'right', marginRight: 10, width: '100%', fontSize: 18 }}>
			<Dropdown overlay={menu}>
				<Icon
					className={'hamburger'}
					style={{ margin: '0 auto', color: 'blue' }}
					onClick={() => setCollapsed(!collapsed)}
					type={'line-chart'}
				/>
			</Dropdown>
		</div>
	);
}
