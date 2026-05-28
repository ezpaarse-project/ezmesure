import { ofetch } from 'ofetch';

const $fetch = ofetch.create({
  baseURL: 'http://localhost:3000/',
  timeout: 3000,
  ignoreResponseError: true,
});

export default $fetch;
