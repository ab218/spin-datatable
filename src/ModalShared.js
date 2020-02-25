import React from 'react';
// import { Card, Radio } from 'antd';
import { Button, Card, Radio, Typography } from 'antd';
import RemoveColumnButton from './RemoveColumnButton';

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

function addColumnToList(col, setCol, selectedColumn) {
	if (!selectedColumn || col.length > 0) return;
	setCol((prevState) => prevState.concat(selectedColumn));
}

export function CaratButtons({ data, setData, label, selectedColumn }) {
	return (
		<div style={styles.flexColumn}>
			<Button
				disabled={data.length !== 0}
				style={{ marginBottom: 5 }}
				onClick={() => addColumnToList(data, setData, selectedColumn)}
			>
				{label}
			</Button>
		</div>
	);
}

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

function removeColumnFromList(setCol, column) {
	setCol((prevState) => prevState.filter((col) => col !== column));
}

export function RadioGroup({ data, styleProps, removeData }) {
	return (
		<Card bordered style={{ ...styles.cardWithBorder, ...styleProps }}>
			<Radio.Group style={styles.radioGroup} buttonStyle="solid">
				{data.length === 0 ? <em>Required</em> : null}
				{data.map((column) => (
					<div style={{ display: 'flex', ...styles.radioButton }} key={column.id}>
						<Typography.Text ellipsis={true} style={{ paddingLeft: 5, margin: 'auto' }}>
							{column.label}
						</Typography.Text>
						<RemoveColumnButton removeColumn={() => removeColumnFromList(removeData, column)} />
					</div>
				))}
			</Radio.Group>
		</Card>
	);
}
