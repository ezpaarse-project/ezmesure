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

export const PLUGIN_APP_NAME = 'ezMESURE';
export const PLUGIN_ID = `${PLUGIN_APP_NAME.toLowerCase()}_reporting`;
export const PLUGIN_NAME = 'Reporting';
export const PLUGIN_DESCRIPTION = `Manage your reports generated from ${PLUGIN_APP_NAME}.`;
export const PLUGIN_ICON = 'reportingApp';
export const API_URL = 'http://localhost:4000';
export const EZMESURE_CATEGORY = {
  id: `${PLUGIN_APP_NAME.toLowerCase()}_category`,
  label: PLUGIN_APP_NAME,
  euiIconType: '',
  order: 1001,
};
