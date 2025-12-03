import axios from 'axios';

const ezmesure = axios.create({
  timeout: 3000,
  proxy: false,
  baseURL: 'http://localhost:3000/',
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  validateStatus: (status) => status < 500,
});

export default ezmesure;
