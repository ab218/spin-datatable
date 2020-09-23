import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

export default function RemoveColumnButton({ removeColumn }) {
	return (
		<Tooltip onClick={removeColumn} className="pointer" title="Remove Column">
			<Button
				icon={<CloseOutlined />}
				style={{
					color: 'red',
					alignSelf: 'center',
					border: 'none',
				}}
			/>
		</Tooltip>
	);
}
