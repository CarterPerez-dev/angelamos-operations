// ===================
// AngelaMos | 2026
// api.config.ts
// ===================

import axios, { type AxiosInstance } from 'axios'
import { transformAxiosError } from './errors'

const getBaseURL = (): string => {
  return import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(transformAxiosError(error))
)
