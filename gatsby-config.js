const path = require('path');

module.exports = {
    plugins: [
        `gatsby-plugin-postcss`,
        {
            resolve: `gatsby-plugin-google-analytics`,
            options: {
                trackingId: 'UA-140917974-3'
            }
        }
    ]
};
