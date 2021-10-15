export interface IAction {
  name: string;
  description: string;
  icon: string;
  type: string;
  color: string;
  onClick(el: {
    exists?: boolean,
    id?: string;
    dashboardId?: string;
  }): void | string;
}
