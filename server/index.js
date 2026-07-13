const express = require('express')
const cors = require('cors')
const supabase = require('./db')
const pingAllSites = require('./pinger')

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// GET /sites — return all sites from Supabase
app.get('/sites', async (req, res) => {
  const { data, error } = await supabase.from('sites').select('*')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /sites — add a new site to Supabase
app.post('/sites', async (req, res) => {
  const { name, url } = req.body
  const { data, error } = await supabase
    .from('sites')
    .insert([{ name, url }])
    .select()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data[0])
})

// DELETE /sites/:id — remove a site
app.delete('/sites/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from('sites').delete().eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Site deleted' })
})

// POST /check — ping all sites and save results
app.post('/check', async (req, res) => {
  await pingAllSites()
  res.json({ message: 'Check complete' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

// GET /sites/:id/history — last 10 checks for a site
app.get('/sites/:id/history', async (req, res) => {
  const { id } = req.params
  const { data, error } = await supabase
    .from('checks')
    .select('*')
    .eq('site_id', id)
    .order('checked_at', { ascending: false })
    .limit(10)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.get('/sites', async (req, res) => {
  const { data: sites, error } = await supabase.from('sites').select('*')
  if (error) return res.status(500).json({ error: error.message })

  const sitesWithUptime = await Promise.all(sites.map(async (site) => {
    const { data: checks } = await supabase
      .from('checks')
      .select('status')
      .eq('site_id', site.id)

    const total = checks?.length || 0
    const upCount = checks?.filter(c => c.status === 'up').length || 0
    const uptime = total > 0 ? ((upCount / total) * 100).toFixed(1) : null

    // get latest check for current status
    const { data: latest } = await supabase
      .from('checks')
      .select('*')
      .eq('site_id', site.id)
      .order('checked_at', { ascending: false })
      .limit(1)

    return {
      ...site,
      uptime_percentage: uptime,
      status: latest?.[0]?.status || 'unknown',
      response_time: latest?.[0]?.response_time || null
    }
  }))

  res.json(sitesWithUptime)
})