import { useState } from 'react'

function AddSiteForm({ onAdd }) {
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")

  const handleSubmit = () => {
    if (!name || !url) return
    onAdd({ name, url })
    setName("")
    setUrl("")
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 mb-6">
      <h2 className="text-white font-semibold text-lg mb-4">Add a Website</h2>
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Site name (e.g. Google)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-2 flex-1 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="URL (e.g. https://google.com)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-2 flex-1 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition"
        >
          Add Site
        </button>
      </div>
    </div>
  )
}

export default AddSiteForm