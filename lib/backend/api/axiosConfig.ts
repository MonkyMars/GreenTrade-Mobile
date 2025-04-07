import axios from 'axios'

const BASE_URL = 'https://greentradeeu.up.railway.app'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

export default api
