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
        {
            resolve: `gatsby-plugin-google-analytics`,
            options: {
                trackingId: 'UA-140917974-3'
            }
        }
    ]
};
