import {
  format,
  startOfQuarter,
  endOfQuarter,
  addQuarters,
} from 'date-fns';

export const DEFAULT_REPORTS_IDS = [
  'DR',
  'DR_D1',
  'IR',
  'PR',
  'PR_P1',
  'TR',
  'TR_B1',
  'TR_J1',
];

export const SUPPORTED_COUNTER_VERSIONS = ['5', '5.1'];

export function getQuarterPeriod(reference = new Date(), offset = 0) {
  const quarter = addQuarters(reference, offset);
  return {
    beginDate: format(startOfQuarter(quarter), 'yyyy-MM'),
    endDate: format(endOfQuarter(quarter), 'yyyy-MM'),
  };
}
