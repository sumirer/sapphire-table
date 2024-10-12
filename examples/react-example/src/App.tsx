import './App.css';
import { SapphireTable } from '@sapphire-table/sapphire-react';
import type { IExpandParams, ITableConfig } from '@sapphire-table/core';
import { TableColumnFactory } from '@sapphire-table/core';
import '@sapphire-table/sapphire-react/lib/style.css';
import { useState } from 'react';

function App() {
	const [loading, setLoading] = useState(false);

	const columns = new TableColumnFactory()
		.factory((factory) => {
			factory.addExpandColum(30);
			factory.addSelection();
			for (let index = 0; index < 3; index++) {
				factory
					.addColumn('mock-title' + index, 'test' + index)
					.setWith(100)
					.setFixed('right')
					.setResize(true)
					.setSort(true);
			}
			for (let index = 0; index < 3; index++) {
				factory
					.addColumn('mock-title' + index, 'test' + index)
					.setWith(100)
					.setFixed('left')
					.setResize(true)
					.setSort(true)
					.setFilter('text');
			}
			for (let index = 0; index < 1000; index++) {
				factory
					.addColumn('mock-title' + index, 'test' + index)
					.setWith(200)
					.setResize(true)
					.setSort(true);
			}
		})
		.build();

	interface IExpandData extends IExpandParams {
		pageIndex: number;
		pageNumber: number;
	}

	const tableConfig: ITableConfig<IExpandData> = {
		dataLoadMethod: () => {
			setLoading(true);
			return new Promise<any[]>((resolve) => {
				setTimeout(() => {
					const mockPrefix = Math.random().toString();
					const mockData = [];
					for (let index = 0; index < 1000; index++) {
						const obj: Record<string, any> = {};
						for (let index1 = 0; index1 < 1000; index1++) {
							obj['test' + index1] = `${mockPrefix}-mock-${index1}-${index}`;
						}
						mockData.push(obj);
					}
					setLoading(false);
					resolve(mockData);
				}, 1000);
			});
		},
		expandConfig: {
			expandDefaultParams: {
				data: [],
				columns: [],
				loading: false,
				pageIndex: 1,
				pageNumber: 20,
			},
			dataLoadMethod(params) {
				if (params.data.length > 0) {
					return Promise.resolve();
				}
				params.loading = true;
				return new Promise((resolve) => {
					setTimeout(() => {
						const mockPrefix = Math.random().toString();
						const mockData = [];
						for (let index = 0; index < 1000; index++) {
							const obj: Record<string, any> = {};
							for (let index1 = 0; index1 < 1000; index1++) {
								obj['test' + index1] = `${mockPrefix}-mock-${index1}-${index}`;
							}
							mockData.push(obj);
						}
						params.columns = new TableColumnFactory()
							.factory((factory) => {
								factory.addSelection();
								for (let index = 0; index < 3; index++) {
									factory
										.addColumn('mock-title' + index, 'test' + index)
										.setWith(100)
										.setFixed('right')
										.setResize(true)
										.setSort(true);
								}
								for (let index = 0; index < 1; index++) {
									factory
										.addColumn('mock-title' + index, 'test' + index)
										.setWith(100)
										.setFixed('left')
										.setResize(true)
										.setSort(true)
										.setFilter('text');
								}
								for (let index = 0; index < 10; index++) {
									factory
										.addColumn('mock-title' + index, 'test' + index)
										.setWith(200)
										.setResize(true)
										.setSort(true);
								}
							})
							.build();
						params.data = mockData;
						params.loading = false;
						resolve();
					}, 1000);
				});
			},
		},
	};

	return (
		<div style={{ height: '600px' }}>
			<SapphireTable
				columns={columns}
				config={tableConfig}
				loading={loading}
				horizontalRenderFillDistance={300}
				verticalRenderFillDistance={200}
				slots={{
					expandSlots: ({ expandData, expandHeight, config }) => {
						return (
							<div
								style={{
									height: `${expandHeight}px`,
									paddingLeft: '20px',
									background: '#f8f8f8',
								}}
							>
								<SapphireTable
									columns={expandData.columns}
									loading={expandData.loading}
									config={config}
								/>
							</div>
						);
					},
				}}
				style={{ height: '600px' }}
			></SapphireTable>
		</div>
	);
}

export default App;
