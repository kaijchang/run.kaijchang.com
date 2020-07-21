module.exports = {
    plugins: [
        `gatsby-source-strava`,
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
