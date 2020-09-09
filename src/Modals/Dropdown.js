import React from 'react';
import { DownOutlined } from '@ant-design/icons';
import { Menu, Dropdown } from 'antd';
import { createModelingTypeIcon } from './ModalShared';

export default function DropdownMenu({ columnType, setColumnType, menuItems, modelingTypeIcons, disabledType }) {
	const mapMenu = (arr, i) => {
		return (
			<Menu>
				{arr.map((menuItem) => (
					<Menu.Item disabled={menuItem === disabledType} key={menuItem} onClick={() => setColumnType(menuItem)}>
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
				{columnType} <DownOutlined />
			</div>
		</Dropdown>
	);
}
