import React from 'react';
import { RightOutlined } from '@ant-design/icons';
import { Button, Card, Radio, Tooltip, Typography } from 'antd';
import RemoveColumnButton from './RemoveColumnButton';
import { ORDINAL, CONTINUOUS, NOMINAL } from '../constants';

export const styles = {
	cardWithBorder: {
		border: '1px solid lightgray',
		width: 220,
		minHeight: 100,
		overflowY: 'scroll',
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

export function CaratButtons({ notAllowed, data, setData, label, selectedColumn }) {
	const notAllowedType = selectedColumn && notAllowed && notAllowed.includes(selectedColumn.modelingType);
	return (
		<div style={styles.flexColumn}>
			<Button
				disabled={!selectedColumn || notAllowedType || data.length !== 0}
				style={{
					marginBottom: 5,
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					paddingRight: '5px',
				}}
				onClick={() => addColumnToList(data, setData, selectedColumn)}
			>
				<span>{label}</span>
				<RightOutlined />
			</Button>
		</div>
	);
}

function SelectedColumn({ data, styleProps, removeData, performingAnalysis }) {
	const { cardWithBorder, radioGroup, radioButton, columnTypography } = styles;
	return (
		<Card bordered style={{ ...cardWithBorder, ...styleProps }}>
			<div style={radioGroup}>
				{data.length === 0 ? <em>Required</em> : null}
				{data.map((column) => (
					<div style={{ display: 'flex', ...radioButton }} key={column.id}>
						<Typography.Text ellipsis={true} style={columnTypography}>
							{createModelingTypeIcon(column.modelingType)}
							{column.label}
						</Typography.Text>
						<RemoveColumnButton
							removeColumn={() => (performingAnalysis ? null : removeColumnFromList(removeData, column))}
						/>
					</div>
				))}
			</div>
		</Card>
	);
}

function removeColumnFromList(setCol, column) {
	setCol((prevState) => prevState.filter((col) => col !== column));
}

export function SelectColumn({ columns, groupingColData, setSelectedColumn, styleProps, title, errorMessage }) {
	const { cardWithBorder, radioButton, radioGroup } = styles;
	return (
		<div>
			{title}
			<Card bordered style={{ height: '200px', marginTop: 20, ...cardWithBorder }}>
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
							{errorMessage ? (
								errorMessage
							) : (
								'There must be at least one column with at least three valid data points to run this type of analysis.'
							)}
						</div>
					)}
				</Radio.Group>
			</Card>
		</div>
	);
}

export function VariableSelector({ notAllowed, styleProps, data, setData, selectedColumn, label, performingAnalysis }) {
	return (
		<div style={{ ...styles.flexSpaced, ...styleProps }}>
			<CaratButtons
				notAllowed={notAllowed}
				data={data}
				setData={setData}
				selectedColumn={selectedColumn}
				label={label}
			/>
			<SelectedColumn data={data} removeData={setData} performingAnalysis={performingAnalysis} />
		</div>
	);
}

export function NominalIcon({ styleProps }) {
	return (
		<Tooltip title={NOMINAL}>
			<span style={{ margin: '0 10px 0 5px', fontStyle: 'italic', fontWeight: 'bold', color: 'red', ...styleProps }}>
				N
			</span>
		</Tooltip>
	);
}

export function ContinuousIcon({ styleProps }) {
	return (
		<Tooltip title={CONTINUOUS}>
			<span style={{ margin: '0 10px 0 5px', fontStyle: 'italic', fontWeight: 'bold', color: 'blue', ...styleProps }}>
				C
			</span>
		</Tooltip>
	);
}

export function OrdinalIcon({ styleProps }) {
	return (
		<Tooltip title={ORDINAL}>
			<span style={{ margin: '0 10px 0 5px', fontStyle: 'italic', fontWeight: 'bold', color: 'green', ...styleProps }}>
				O
			</span>
		</Tooltip>
	);
}

export function createModelingTypeIcon(modelingType) {
	switch (modelingType) {
		case CONTINUOUS:
			return <ContinuousIcon />;
		case NOMINAL:
			return <NominalIcon />;
		case ORDINAL:
			return <OrdinalIcon />;
		default:
			return;
	}
}
