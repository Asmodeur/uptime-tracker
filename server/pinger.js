const axios = require('axios')
const supabase = require('./db')

async function pingAllSites() {
  const { data: sites, error } = await supabase.from('sites').select('*')
  if (error) {
    console.log('Error fetching sites:', error.message)
    return
  }

  for (const site of sites) {
    const startTime = Date.now()
    let status = 'down'
    let responseTime = null

    try {
      await axios.get(site.url, { timeout: 5000 })
      status = 'up'
      responseTime = Date.now() - startTime
    } catch (err) {
      status = 'down'
      responseTime = null
    }

    await supabase.from('checks').insert([{
      site_id: site.id,
      status,
      response_time: responseTime
    }])

    console.log(`${site.name}: ${status} (${responseTime}ms)`)
  }
}

module.exports = pingAllSites