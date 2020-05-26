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
    ],
    siteMetadata: {
        blogUrl: 'https://blog.kaijchang.com',
        githubUrl: 'https://github.com/kajchang',
        linkedinUrl: 'https://www.linkedin.com/in/kai-j-chang/',
        emailAddress: 'kaijchang@gmail.com'
    }
};
