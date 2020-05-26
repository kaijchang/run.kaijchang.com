import React, { useEffect, useState } from 'react';
import Marquee from 'react-double-marquee';

import { graphql, useStaticQuery } from 'gatsby';
import moment from 'moment';

import 'typeface-roboto';
import './styles/layout.css';

export default ({ children }) => {
    const data = useStaticQuery(graphql`
        query {
            site {
                siteMetadata {
                    blogUrl
                    githubUrl
                    linkedinUrl
                    emailAddress
                }
            }
        }
    `);

    const siteMetadata = data.site.siteMetadata;

    return (
        <>
            <div className='fixed flex flex-col h-30 w-screen p-5'>
                <div className='flex flex-row items-center'>
                    <h3 className='text-lg ml-5'>
                        <a href={ siteMetadata.githubUrl } target='_blank' rel='noopener noreferrer'>Github</a>
                    </h3>
                    <h3 className='text-lg ml-5'>
                        <a href={ siteMetadata.linkedinUrl } target='_blank' rel='noopener noreferrer'>Linkedin</a>
                    </h3>
                    <h3 className='text-lg ml-5'>
                        <a href={ siteMetadata.blogUrl } target='_blank' rel='noopener noreferrer'>Blog</a>
                    </h3>
                    <h3 className='text-lg ml-5'>
                        <a href={ 'mailto:' + siteMetadata.emailAddress } target='_blank' rel='noopener noreferrer'>Email</a>
                    </h3>
                </div>
            </div>
            { children }
        </>
    );
}
