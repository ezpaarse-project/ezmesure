import { ICategory } from './models/category';

export const PLUGIN_APP_NAME: string = 'ezMESURE';
export const PLUGIN_ID: string = `ezreporting`;
export const PLUGIN_NAME: string = 'Reporting';
export const PLUGIN_DESCRIPTION: string = `Manage your reports generated from %APP_NAME%.`;
export const PLUGIN_ICON: string = 'reportingApp';
export const API_URL: string = 'http://localhost:4000';
export const CATEGORY: ICategory = {
  id: `${PLUGIN_APP_NAME.toLowerCase()}_category`,
  label: PLUGIN_APP_NAME,
  euiIconType: '',
  order: 1001,
};
