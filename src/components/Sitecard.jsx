import { useState } from 'react'
import StatusBadge from './StatusBadge'
import HistoryLog from './HistoryLog'
import DeleteButton from './DeleteButton'

function Sitecard({ id, name, url, status, responseTime, uptimePercentage, onDelete }) {
  const [showHistory, setShowHistory] = useState(false)

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-white font-bold text-lg">{name}</h2>
          <p className="text-gray-400 text-sm">{url}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="flex gap-6 text-sm mb-4">
        <div>
          <p className="text-gray-500 text-xs uppercase">Response</p>
          <p className="text-white font-semibold">
            {responseTime ? responseTime + "ms" : "N/A"}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase">Uptime</p>
          <p className="text-white font-semibold">
            {uptimePercentage ? uptimePercentage + "%" : "No data"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-blue-400 hover:text-blue-300 text-sm transition"
        >
          {showHistory ? "Hide History" : "Show History"}
        </button>
        <DeleteButton siteId={id} onDelete={onDelete} />
      </div>

      {showHistory && <HistoryLog siteId={id} />}
    </div>
  )
}

export default Sitecard