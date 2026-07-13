import { useState, useEffect } from 'react'
import { getHistory } from '../services/api'

function HistoryLog({ siteId }) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    const loadHistory = async () => {
      const data = await getHistory(siteId)
      setHistory(data)
    }
    loadHistory()
  }, [siteId])

  if (history.length === 0) return (
    <p className="text-gray-500 text-sm mt-2">No history yet</p>
  )

  return (
    <div className="mt-3 border-t border-gray-700 pt-3">
      <h3 className="text-gray-400 text-xs font-semibold uppercase mb-2">Last 10 Checks</h3>
      <div className="space-y-1">
        {history.map(check => (
          <div key={check.id} className="flex items-center gap-3 text-sm">
            <span className="text-gray-500 text-xs">
              {new Date(check.checked_at).toLocaleTimeString()}
            </span>
            <span>{check.status === "up" ? "🟢" : "🔴"}</span>
            <span className="text-gray-300">
              {check.response_time ? check.response_time + "ms" : "timeout"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HistoryLog