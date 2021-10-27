export interface ITask {
  id: string;
  dashboardId: string | null;
  exists: boolean;
  reporting: {
    frequency: string;
    emails: Array<string>;
    createdAt: string;
    sentAt?: string;
    runAt?: string;
    print: boolean;
  },
  space: string;
}
