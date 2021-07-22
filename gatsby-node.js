const fetch = require('node-fetch')

exports.onCreateNode = async ({ node, actions, cache }) => {
  const { createNodeField } = actions
  
  if (node.internal.owner === 'gatsby-source-strava') {
    const key = node.internal.contentDigest
    let data = await cache.get(key)
    if (!data && node.activity) {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${node.activity.start_longitude},${node.activity.start_latitude}.json?access_token=${process.env.GATSBY_MAPBOX_TOKEN}`)
      data = await res.json()
    }
    await cache.set(key, data)
    createNodeField({
      node,
      name: 'geocoding',
      value: data
    })
  }
}
