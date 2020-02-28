import React from 'react';
import { Button, Card, Icon, Radio, Tooltip, Typography } from 'antd';
import RemoveColumnButton from './RemoveColumnButton';

export const styles = {
	cardWithBorder: {
		border: '1px solid lightgray',
		width: 250,
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
		minWidth: 200,
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
	columnTypography: {
		paddingLeft: 5,
		margin: 'auto',
	},
	variableLegend: {
		width: '40%',
		height: '40%',
		border: '1px solid black',
	},
};

function addColumnToList(col, setCol, selectedColumn) {
	if (!selectedColumn || col.length > 0) return;
	setCol((prevState) => prevState.concat(selectedColumn));
}

function CaratButtons({ data, setData, label, selectedColumn }) {
	return (
		<div style={styles.flexColumn}>
			<Button
				disabled={!selectedColumn || data.length !== 0}
				style={{ marginBottom: 5 }}
				onClick={() => addColumnToList(data, setData, selectedColumn)}
			>
				{label}
				<Icon type="right" style={{ marginLeft: 40 }} />
			</Button>
		</div>
	);
}

function RadioGroup({ data, styleProps, removeData }) {
	const { cardWithBorder, radioGroup, radioButton, columnTypography } = styles;
	return (
		<Card bordered style={{ ...cardWithBorder, ...styleProps }}>
			<Radio.Group style={radioGroup} buttonStyle="solid">
				{data.length === 0 ? <em>Required</em> : null}
				{data.map((column) => (
					<div style={{ display: 'flex', ...radioButton }} key={column.id}>
						<Typography.Text ellipsis={true} style={columnTypography}>
							{createModelingTypeIcon(column.modelingType)}
							{column.label}
						</Typography.Text>
						<RemoveColumnButton removeColumn={() => removeColumnFromList(removeData, column)} />
					</div>
				))}
			</Radio.Group>
		</Card>
	);
}

function removeColumnFromList(setCol, column) {
	setCol((prevState) => prevState.filter((col) => col !== column));
}

export function SelectColumn({ columns, groupingColData, setSelectedColumn }) {
	const { cardWithBorder, radioButton, radioGroup } = styles;
	return (
		<div>
			Select Column
			<Card bordered style={{ marginTop: 20, ...cardWithBorder }}>
				<Radio.Group style={radioGroup} buttonStyle="solid">
					{/* display only columns with labels and some data */}
					{columns.length > 0 ? (
						columns.map((column) => {
							return (
								<Radio.Button
									style={{ display: 'flex', ...radioButton }}
									key={column.id}
									onClick={() => setSelectedColumn(column)}
									value={column}
									disabled={groupingColData === column}
								>
									<Typography.Text ellipsis={true} style={styles.columnTypography}>
										{createModelingTypeIcon(column.modelingType)}
										{column.label}
									</Typography.Text>
								</Radio.Button>
							);
						})
					) : (
						<div style={{ color: 'red' }}>
							There must be at least one column with at least three valid data points to run this type of analysis.
						</div>
					)}
				</Radio.Group>
			</Card>
		</div>
	);
}

export function VariableSelector({ styleProps, data, setData, selectedColumn, label }) {
	return (
		<div style={{ ...styles.flexSpaced, ...styleProps }}>
			<CaratButtons data={data} setData={setData} selectedColumn={selectedColumn} label={label} />
			<RadioGroup data={data} removeData={setData} />
		</div>
	);
}

export function NominalIcon() {
	return (
		<Tooltip title="Nominal">
			<span style={{ margin: '0 10px 0 5px', fontStyle: 'italic', fontWeight: 'bold', color: 'red' }}>N</span>
		</Tooltip>
	);
}

export function ContinuousIcon() {
	return (
		<Tooltip title="Continuous">
			<span style={{ margin: '0 10px 0 5px', fontStyle: 'italic', fontWeight: 'bold', color: 'blue' }}>C</span>
		</Tooltip>
	);
}

export function OrdinalIcon() {
	return (
		<Tooltip title="Ordinal">
			<span style={{ margin: '0 10px 0 5px', fontStyle: 'italic', fontWeight: 'bold', color: 'green' }}>O</span>
		</Tooltip>
	);
}

export function createModelingTypeIcon(modelingType) {
	switch (modelingType) {
		case 'Continuous':
			return <ContinuousIcon />;
		case 'Nominal':
			return <NominalIcon />;
		case 'Ordinal':
			return <OrdinalIcon />;
		default:
			return;
	}
}
