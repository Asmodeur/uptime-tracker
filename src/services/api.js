const API_URL = 'http://localhost:3001'

export async function getSites() {
  const response = await fetch(`${API_URL}/sites`)
  return response.json()
}

export async function addSite(site) {
  const response = await fetch(`${API_URL}/sites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(site)
  })
  return response.json()
}

export async function checkSites() {
  const response = await fetch(`${API_URL}/check`, {
    method: 'POST'
  })
  return response.json()
}

export async function deleteSite(id) {
  const response = await fetch(`${API_URL}/sites/${id}`, {
    method: 'DELETE'
  })
  return response.json()
}
export async function getHistory(siteId) {
  const response = await fetch(`${API_URL}/sites/${siteId}/history`)
  return response.json()
}