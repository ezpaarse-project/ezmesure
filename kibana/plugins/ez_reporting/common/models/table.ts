import { ITask } from './task';
import { ISpace } from './space';
import { IFrequency } from './frequency';
import { IDashboard } from './dashboard';

export interface ITableProps {
  tasks: Array<ITask>;
  spaces: Array<ISpace>;
  frequencies: Array<IFrequency>;
  dashboards: Array<IDashboard>;
  admin: boolean;
  onSelectionChangeHandler(tasksId: Array<string>): void;
}

export interface ITableState {
  itemIdToExpandedRowMap: object;
  pageIndex: number;
  pageSize: number;
  sortField: string;
  sortDirection: string;
}