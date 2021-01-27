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

import request from 'request';
import { API_URL } from '../../common';

const apiUrl = process.env.REPORTING_URL || API_URL;

export const requestApi = (opts) =>
  new Promise((resolve, reject) => {
    request(
      {
        method: opts.method,
        url: `${apiUrl}${opts.url}`,
        json: opts.body ? true : false,
        body: opts.body || null,
      },
      (error, response, body) => {
        if (error) return reject(error);

        return resolve({ body });
      }
    );
  });
