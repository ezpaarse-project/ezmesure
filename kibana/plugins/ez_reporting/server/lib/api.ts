import request from 'request';
import { API_URL } from '../../common';
import { HttpAuth } from '../../../../src/core/server';

const apiUrl = process.env.REPORTING_URL || API_URL;

export const requestApi = (auth: HttpAuth, opts) =>
  new Promise((resolve, reject) => {
    request(
      {
        method: opts.method,
        url: `${apiUrl}${opts.url}?user=${auth.state.username}&admin=true`,
        json: opts.body ? true : false,
        body: opts.body || null,
      },
      (error, response, body) => {
        if (error) return reject(error);

        return resolve({ body });
      }
    );
  });
