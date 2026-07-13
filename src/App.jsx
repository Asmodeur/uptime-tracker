import { useState, useEffect } from 'react'
import Header from './components/Header'
import SiteList from './components/SiteList'
import AddSiteForm from './components/AddSiteForm'
import { getSites, addSite, checkSites } from './services/api'

function App() {
  const [sites, setSites] = useState([])
  const [lastRefresh, setLastRefresh] = useState(null)
  const [isChecking, setIsChecking] = useState(false)

  const loadSites = async () => {
    const data = await getSites()
    setSites(data)
  }

  const runCheck = async () => {
    setIsChecking(true)
    await checkSites()
    await loadSites()
    setLastRefresh(new Date())
    setIsChecking(false)
  }

  const handleAdd = async (newSite) => {
    await addSite(newSite)
    await loadSites()
  }

  const handleDelete = (deletedId) => {
    setSites(sites.filter(site => site.id !== deletedId))
  }

  useEffect(() => {
    loadSites()
    runCheck()
    const interval = setInterval(() => runCheck(), 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-400 text-sm">
            {isChecking
              ? "⏳ Checking sites..."
              : lastRefresh
              ? `Last checked: ${lastRefresh.toLocaleTimeString()}`
              : "Loading..."}
          </p>
        </div>
        <AddSiteForm onAdd={handleAdd} />
        <SiteList sites={sites} onDelete={handleDelete} />
      </div>
    </div>
  )
}

export default App