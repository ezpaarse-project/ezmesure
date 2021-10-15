import { PLUGIN_ID } from '../common';
import { IFrequency } from '../common/models/frequency';
import { ITask } from '../common/models/task';
import { HttpStart } from '../../../../../src/core/public/http';
import { NotificationsSetup } from '../../../../../src/core/public/notifications';
import { Capabilities } from '../../../../../src/core/public/application';

export const convertFrequency = (frequencies: Array<IFrequency>, frequency: string): string => {
  const freq: IFrequency = frequencies.find((f: IFrequency) => f.value === frequency);
  return freq ? freq.text : 'Error';
};

export const defaultTask = (dashboardId): ITask => ({
  id: '',
  dashboardId: dashboardId || null,
  exists: true,
  reporting: {
    frequency: '1w',
    emails: [],
    createdAt: '',
    print: false,
  },
  space: '',
});

export const ms2Str = (time: number): string => {
  let ms: number = time;
  let s: number = Math.floor(ms / 1000);
  ms %= 1000;
  let m: number = Math.floor(s / 60);
  s %= 60;
  const h: number = Math.floor(m / 60);
  m %= 60;

  if (h) {
    return `${h}h ${m}m`;
  }
  if (m) {
    return `${m}m ${s}s`;
  }
  if (s) {
    return `${s}s`;
  }

  return `${ms}ms`;
};

export let httpClient: HttpStart;

export function setHttpClient(http: HttpStart): void {
  httpClient = http;
}

export let toasts: NotificationsSetup;

export function setToasts(notifications: NotificationsSetup): void {
  toasts = notifications;
}

export let capabilities: Capabilities;

export function setCapabilities(capa: Capabilities): void {
  capabilities = capa[PLUGIN_ID] || {};
}
