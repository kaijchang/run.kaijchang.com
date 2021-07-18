module.exports = {
    plugins: [
        {
            resolve: `gatsby-source-strava`,
            options: {
                debug: true
            }
        },
        `gatsby-plugin-postcss`,
        `gatsby-plugin-typescript`,
    ]
};
