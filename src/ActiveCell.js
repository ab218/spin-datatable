import React, { Component } from 'react';
export default class ActiveCell extends Component {
	constructor(props) {
		super(props);
		this.state = {
			currentValue: this.props.value,
			oldValue: this.props.value,
		};
	}

	componentWillUnmount() {
		const { columnIndex, rowIndex, updateCell } = this.props;
		const { currentValue } = this.state;
		updateCell(currentValue, rowIndex, columnIndex);
	}

	render() {
		const { column, createNewRows, rows, rowIndex } = this.props;
		return (
			<div style={{ height: '100%', width: '100%' }} onContextMenu={(e) => this.handleContextMenu(e)}>
				<input
					autoFocus
					onFocus={(e) => e.target.select()}
					type="text"
					style={{
						textAlign: column.type === 'String' ? 'left' : 'right',
						height: '100%',
						width: '100%',
					}}
					value={this.state.currentValue}
					onChange={(e) => {
						e.preventDefault();
						if (rowIndex + 1 > rows.length) {
							createNewRows(rowIndex + 1 - rows.length);
						}
						this.setState({ currentValue: e.target.value });
					}}
				/>
			</div>
		);
	}
}
