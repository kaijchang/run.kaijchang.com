const fetch = require('node-fetch')

exports.onCreateNode = async ({ node, actions, cache }) => {
  const { createNodeField } = actions
  
  if (node.internal.owner === 'gatsby-source-strava') {
    const key = node.internal.contentDigest
    let data = await cache.get(key)
    if (!data && node.activity) {
      let res;
      do {
        res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${node.activity.start_latlng[1]},${node.activity.start_latlng[0]}.json?access_token=${process.env.GATSBY_MAPBOX_TOKEN}`)
        await new Promise(r => setTimeout(r, 60 * 1000 / 600 * 2))
      } while (res.status === 429)

      if (res.status !== 200) {
        throw new Error(`Error fetching geocoding data: ${res.status} ${res.statusText}\nResponse: ${JSON.stringify(await res.json())}\nActivity: ${JSON.stringify(node.activity)}`)
      }

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
