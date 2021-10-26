import { ISpace } from './space';
import { IDashboard } from './dashboard';
import { IFrequency } from './frequency';
import { ITask } from './task';

export interface IEditProps {
  dashboards: Array<IDashboard>;
  frequencies: Array<IFrequency>;
  spaces: Array<ISpace>;
  admin: boolean;
  editTaskHandler(task: object): Promise<object>;
  saveTaskHandler(task: object): Promise<object>;
}

export interface IEditState {
  isFlyoutVisible: boolean;
  edit: boolean;
  currentTask: ITask;
  email: string;
  receivers: Array<string>;
  mailErrorMessages: Array<string>;
  dashboardErrorMessages: Array<string>;
  spaceErrorMessages: Array<string>;
}

export interface ISelectedSpace {
  value?: string;
  label: string;
  color: string;
}

export interface ISelectedDashboard {
  value: string,
  label: string,
}