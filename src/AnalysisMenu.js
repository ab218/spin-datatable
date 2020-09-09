import React from 'react';
import { Menu, Dropdown } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';
import { useSpreadsheetDispatch, useSelectDispatch } from './context/SpreadsheetProvider';
import {
	REMOVE_SELECTED_CELLS,
	TOGGLE_ANALYSIS_MODAL,
	TOGGLE_BAR_CHART_MODAL,
	TOGGLE_DISTRIBUTION_MODAL,
	TOGGLE_FILTER_MODAL,
} from './constants';

export default function HamburgerMenu() {
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
				Descriptives
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
		<div style={{ textAlign: 'right', width: '100%', fontSize: 18, backgroundColor: 'white', zIndex: 1 }}>
			<Dropdown overlay={menu}>
				<LineChartOutlined className={'hamburger'} style={{ marginRight: 10, color: 'blue' }} type={'line-chart'} />
			</Dropdown>
		</div>
	);
}
