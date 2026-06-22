const DEFAULT_BACKEND_ORIGIN =
  'http://agrosafe-back.eastus2.azurecontainer.io:8080'

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'origin',
  'transfer-encoding',
])

const buildUpstreamUrl = (request) => {
  const path = Array.isArray(request.query.path)
    ? request.query.path.join('/')
    : request.query.path || ''
  const search = request.url.includes('?')
    ? request.url.slice(request.url.indexOf('?'))
    : ''
  const origin = process.env.BACKEND_API_ORIGIN || DEFAULT_BACKEND_ORIGIN

  return `${origin}/api/${path}${search}`
}

const forwardHeaders = (headers) =>
  Object.fromEntries(
    Object.entries(headers).filter(
      ([name]) => !HOP_BY_HOP_HEADERS.has(name.toLowerCase())
    )
  )

export default async function handler(request, response) {
  const method = request.method || 'GET'
  const hasBody = !['GET', 'HEAD'].includes(method)
  const headers = forwardHeaders(request.headers)
  const body = hasBody && request.body ? JSON.stringify(request.body) : undefined

  if (body) headers['content-type'] = 'application/json'

  try {
    const upstream = await fetch(buildUpstreamUrl(request), {
      method,
      headers,
      body,
    })
    const contentType = upstream.headers.get('content-type')
    const payload = await upstream.text()

    if (contentType) response.setHeader('content-type', contentType)
    response.status(upstream.status).send(payload)
  } catch {
    response.status(502).json({
      code: 'BACKEND_UNAVAILABLE',
      message: 'The backend service is currently unavailable.',
    })
  }
}
