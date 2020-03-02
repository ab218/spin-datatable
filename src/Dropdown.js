import React from 'react';
import { Menu, Dropdown, Icon } from 'antd';
import { createModelingTypeIcon } from './ModalShared';

export default function DropdownMenu({ columnType, setColumnType, menuItems, modelingTypeIcons }) {
	const mapMenu = (arr, i) => {
		return (
			<Menu>
				{arr.map((menuItem) => (
					<Menu.Item key={menuItem} onClick={() => setColumnType(menuItem)}>
						{modelingTypeIcons && createModelingTypeIcon(menuItem)}
						{menuItem}
					</Menu.Item>
				))}
			</Menu>
		);
	};

	return (
		<Dropdown overlay={mapMenu(menuItems)} trigger={[ 'click' ]}>
			<div style={{ cursor: 'pointer' }} className="ant-dropdown-link">
				{modelingTypeIcons && createModelingTypeIcon(columnType)}
				{columnType} <Icon type="down" />
			</div>
		</Dropdown>
	);
}
