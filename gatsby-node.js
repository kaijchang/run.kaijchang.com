const fetch = require('node-fetch')

exports.onCreateNode = async ({ node, actions, cache }) => {
  const { createNodeField } = actions
  
  if (node.internal.owner === 'gatsby-source-strava') {
    const key = node.internal.contentDigest
    let data = await cache.get(key)
    if (!data && node.activity) {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${node.activity.start_latlng[1]},${node.activity.start_latlng[0]}.json?access_token=${process.env.GATSBY_MAPBOX_TOKEN}`)
      data = await res.json()
      // 1.5x the rate limit of 600 requests per mintue
      await new Promise(r => setTimeout(r, 60 * 1000 / 600 * 1.5))
    }
    await cache.set(key, data)
    createNodeField({
      node,
      name: 'geocoding',
      value: data
    })
  }
}

exports.onCreateWebpackConfig = ({ stage, actions }) => {
  actions.setWebpackConfig({
    resolve: {
      extensions: ['*', '.mjs', '.js', '.json']
    },
    module: {
      rules: [
        {
          test: /\.mjs$/,
          include: /node_modules/,
          type: 'javascript/auto'
        }
      ]
    }
  })
}
