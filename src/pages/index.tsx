import React from 'react'

import { OutboundLink } from 'gatsby-plugin-google-analytics';

import { graphql } from 'gatsby';

import '../styles/layout.css';

const MyOutboundLink = ({ children, href, ...props }) => <OutboundLink href={ href } target='_blank' rel='noopener noreferrer' { ...props }>
    { children }
</OutboundLink>

export default ({ data }) => {
    console.log(data);
    return (
        <>
            hello
        </>
    )
};

export const query = graphql`
    query {
        allStravaActivity {
            nodes {
                activity {
                    name
                    distance
                    elapsed_time
                    average_speed
                    average_heartrate
                    start_date_local
                    map {
                        summary_polyline
                    }
                }
            }
        }
    }
`;
