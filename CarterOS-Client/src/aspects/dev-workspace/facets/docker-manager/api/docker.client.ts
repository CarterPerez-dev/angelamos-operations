// ===================
// © AngelaMos | 2025
// docker.client.ts
// ===================

import axios, { type AxiosInstance } from 'axios'

const getDockerAPIBaseURL = (): string => {
  const envURL = import.meta.env.VITE_DOCKER_API_URL

  if (envURL) {
    return envURL
  }

  return 'http://localhost:7771'
}

export const dockerApiClient: AxiosInstance = axios.create({
  baseURL: getDockerAPIBaseURL(),
  timeout: 600000,
  headers: {
    'Content-Type': 'application/json',
  },
})

dockerApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error)
  }
)
