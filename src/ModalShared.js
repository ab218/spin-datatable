import React from 'react';
import { Card, Radio } from 'antd';

export const styles = {
	cardWithBorder: {
		border: '1px solid lightgray',
		width: 200,
		minHeight: 100,
	},
	flexColumn: {
		display: 'flex',
		flexDirection: 'column',
		width: 125,
	},
	flexSpaced: {
		display: 'flex',
		justifyContent: 'space-between',
	},
	radioButton: {
		minWidth: 150,
		fontSize: 14,
		padding: 0,
		margin: 0,
		borderRadius: 0,
		overflow: 'hidden',
		border: '1px solid lightgray',
	},
	radioGroup: {
		width: '100%',
		display: 'flex',
		flexDirection: 'column',
		textAlign: 'center',
		borderRadius: 0,
		padding: 0,
		margin: 0,
	},
};

export function SelectColumn({ columns, setSelectedColumn }) {
	return (
		<Card bordered style={{ marginTop: 20, ...styles.cardWithBorder }}>
			<Radio.Group style={styles.radioGroup} buttonStyle="solid">
				{/* display only columns with labels and some data */}
				{columns.length > 0 ? (
					columns.map((column) => (
						<Radio.Button
							style={styles.radioButton}
							key={column.id}
							onClick={() => setSelectedColumn(column)}
							value={column}
						>
							{column.label}
						</Radio.Button>
					))
				) : (
					<div style={{ color: 'red' }}>
						There must be at least one column with at least three valid data points to run this type of analysis.
					</div>
				)}
			</Radio.Group>
		</Card>
	);
}
