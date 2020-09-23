import React from 'react';
import { Radio, Icon } from 'antd';
import { createModelingTypeIcon } from './ModalShared';

export default function RadioButtons({ columnType, setColumnType, menuItems, modelingTypeIcons, disabledType }) {
	return (
		<Radio.Group defaultValue={columnType} optionType="button" size="small" buttonStyle="solid">
			{menuItems.map((menuItem) => {
				return (
					<Radio.Button
						key={menuItem}
						disabled={menuItem === disabledType}
						value={menuItem}
						onClick={() => setColumnType(menuItem)}
					>
						{modelingTypeIcons && createModelingTypeIcon(menuItem)}
						{menuItem}
					</Radio.Button>
				);
			})}
		</Radio.Group>
	);
}
