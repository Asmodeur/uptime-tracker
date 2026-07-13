function StatusBadge({ status }) {
  if (status === "up") {
    return (
      <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
        🟢 UP
      </span>
    )
  }
  if (status === "down") {
    return (
      <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
        🔴 DOWN
      </span>
    )
  }
  return (
    <span className="bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full">
      ⚪ UNKNOWN
    </span>
  )
}

export default StatusBadge