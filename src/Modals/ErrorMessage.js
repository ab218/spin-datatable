import React, { useEffect } from 'react';
import { Alert } from 'antd';
import { useRowsDispatch } from '../context/SpreadsheetProvider';

export default function ErrorMessage({ error, setError }) {
	const dispatchRowsAction = useRowsDispatch();
	useEffect(
		() => {
			if (error) {
				setTimeout(() => {
					console.log('clear error');
					setError(null);
					dispatchRowsAction({ type: 'CLEAR_ERROR' });
				}, 4000);
			}
		},
		[ dispatchRowsAction, error, setError ],
	);
	return error ? <Alert className="error" message={error} type="error" showIcon /> : <div />;
}
