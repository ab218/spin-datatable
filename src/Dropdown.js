import React from 'react';
import { Menu, Dropdown, Icon } from 'antd';

export default function DropdownMenu({columnType, setColumnType, menuItems}) {

  const mapMenu = (arr, i) => {
    return (
    <Menu>
      {arr.map(menuItem => <Menu.Item key={menuItem} onClick={e => setColumnType(e.item.props.children)}>{menuItem}</Menu.Item>)}
    </Menu>
    )
  }

  return (
    <Dropdown overlay={mapMenu(menuItems)} trigger={['click']}>
      <div style={{cursor: 'pointer'}} className="ant-dropdown-link">
        {columnType} <Icon type="down" />
      </div>
    </Dropdown>
  )
}