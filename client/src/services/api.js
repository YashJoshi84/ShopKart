// API Service
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8003',
  withCredentials: true,
});

export default API;
