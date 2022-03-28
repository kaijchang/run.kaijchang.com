module.exports = {
    plugins: [
        {
            resolve: `gatsby-source-strava`,
            options: {
                debug: true
            }
        },
        {
            resolve: '@chakra-ui/gatsby-plugin',
            options: {
              /**
               * @property {boolean} [resetCSS=true]
               * if false, this plugin will not use `<CSSReset />
               */
              resetCSS: true,
              /**
               * @property {boolean} [isUsingColorMode=true]
               * if false, this plugin will not use <ColorModeProvider />
               */
              isUsingColorMode: true,
            },
        },
        `gatsby-plugin-typescript`,
    ],
};
