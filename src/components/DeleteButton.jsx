import { deleteSite } from '../services/api'

function DeleteButton({ siteId, onDelete }) {
  const handleDelete = async () => {
    await deleteSite(siteId)
    onDelete(siteId)
  }

  return (
    <button
      onClick={handleDelete}
      className="text-red-400 hover:text-red-300 text-sm mt-3 transition"
    >
      Delete
    </button>
  )
}

export default DeleteButton