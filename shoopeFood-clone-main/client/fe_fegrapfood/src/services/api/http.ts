const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

type RequestOptions = RequestInit & {
  query?: Record<string, string | number | boolean>
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(path, API_BASE_URL)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, String(value))
    })
  }

  return url.toString()
}

export async function httpGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return request<T>(path, {
    method: 'GET',
    ...options,
  })
}

export async function httpPost<T>(path: string, body: unknown, options: RequestOptions = {}): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options,
  })
}

export async function httpPut<T>(path: string, body: unknown, options: RequestOptions = {}): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
    ...options,
  })
}

export async function httpDelete<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return request<T>(path, {
    method: 'DELETE',
    ...options,
  })
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, headers, ...restOptions } = options
  const response = await fetch(buildUrl(path, query), {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...restOptions,
  })

  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status}`

    try {
      const errorData = (await response.json()) as { message?: string }
      if (errorData.message) {
        errorMessage = errorData.message
      }
    } catch {
      // Keep the default message when the server does not return JSON.
    }

    throw new Error(errorMessage)
  }

  return response.json() as Promise<T>
}
