import React from 'react'
import Helmet from 'react-helmet';

import { OutboundLink } from 'gatsby-plugin-google-analytics';

import '../styles/layout.css';

const MyOutboundLink = ({ children, href, ...props }) => <OutboundLink href={ href } target='_blank' rel='noopener noreferrer' { ...props }>
    { children }
</OutboundLink>

export default () => {
    return (
        <>
            <Helmet>
                <title>website</title>
            </Helmet>
            <div className='flex flex-col items-center mt-20 mx-auto text-center'>
                <h1 className='text-3xl font-bold'>Kai Chang • 张俊洙</h1>
                <h3 className='text-lg mb-5'>San Francisco, California</h3>
                <div className='flex flex-col w-screen'>
                    <div className='mb-5'>
                        <h2 className='text-2xl'>ME</h2>
                        <ul className='list-disc text-md'>
                            <li><MyOutboundLink href='https://github.com/kajchang'>Github</MyOutboundLink></li>
                            <li><MyOutboundLink href='https://www.linkedin.com/in/kai-j-chang'>Linkedin</MyOutboundLink></li>
                            <li><MyOutboundLink href='https://blog.kaijchang.com'>Blog</MyOutboundLink></li>
                            <li><MyOutboundLink href='mailto:kaijchang@gmail.com'>Email</MyOutboundLink></li>
                            <li><MyOutboundLink href='https://www.strava.com/athletes/kachang'>Strava</MyOutboundLink></li>
                        </ul>
                    </div>
                    <div>
                        <h2 className='text-2xl'>THINGS</h2>
                        <ul className='list-disc text-md'>
                            <li><MyOutboundLink href='https://github.com/Team4159'>Robotics</MyOutboundLink></li>
                            <li><MyOutboundLink href='https://studentsreview.me'>studentsreview.me</MyOutboundLink></li>
                            <li><MyOutboundLink href='https://vote.lowellhs.org'>2020 Lowell Mock Primaries</MyOutboundLink></li>
                            <li><MyOutboundLink href='https://arena.lowellhs.com'>Arena Rolodex</MyOutboundLink></li>
                            <li><MyOutboundLink href='https://github.com/StudentVue-Community'>StudentVue Developer Group</MyOutboundLink></li>
                            <li><MyOutboundLink href='https://github.com/kajchang/SFPL'>SFPL API</MyOutboundLink></li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    )
};
