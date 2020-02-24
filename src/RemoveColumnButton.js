import React from 'react';
import { Button, Tooltip } from 'antd';

export default function RemoveColumnButton({ removeColumn }) {
	return (
		<Tooltip onClick={removeColumn} className="pointer" title="Remove Column">
			<Button
				icon="close"
				style={{
					color: 'red',
					// borderTop: 'none',
					// borderRight: 'none',
					// borderBottom: 'none',
					// borderRadius: 0,
					border: 'none',
				}}
			/>
		</Tooltip>
	);
}
