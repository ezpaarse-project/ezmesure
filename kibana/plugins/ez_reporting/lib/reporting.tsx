/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { PLUGIN_ID } from '../common';

export const convertFrequency = (frequencies, frequency) => {
  const freq = frequencies.find(({ value }) => value === frequency);
  return freq ? freq.text : 'Error';
};

export const defaultTask = (dashboardId) => ({
  _id: '',
  dashboardId: dashboardId || null,
  exists: true,
  reporting: {
    frequency: '1w',
    emails: [],
    createdAt: '',
    print: false,
  },
  namespace: '',
});

export const ms2Str = (time) => {
  let ms = time;
  let s = Math.floor(ms / 1000);
  ms %= 1000;
  let m = Math.floor(s / 60);
  s %= 60;
  const h = Math.floor(m / 60);
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

export let httpClient;

export function setHttpClient(http) {
  httpClient = http;
}

export let toasts;

export function setToasts(notifications) {
  toasts = notifications;
}

export let capabilities;

export function setCapabilities(capa) {
  capabilities = capa[PLUGIN_ID] || {};
}
