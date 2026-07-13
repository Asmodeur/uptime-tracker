import Sitecard from './Sitecard'

function SiteList({ sites, onDelete }) {
  if (sites.length === 0) return (
    <p className="text-gray-500 text-center mt-10">No sites added yet. Add one above.</p>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sites.map(site => (
        <Sitecard
          key={site.id}
          id={site.id}
          name={site.name}
          url={site.url}
          status={site.status}
          responseTime={site.response_time}
          uptimePercentage={site.uptime_percentage}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

export default SiteList