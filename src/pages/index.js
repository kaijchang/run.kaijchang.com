import React from 'react'
import Helmet from 'react-helmet';

import { OutboundLink } from 'gatsby-plugin-google-analytics';

import '../styles/layout.css';

const MyOutboundLink = ({ children, href, ...props }) => <OutboundLink href={ href } target='_blank' rel='noopener noreferrer' { ...props }>
    { children }
</OutboundLink>

const Directory = ({ name, initiallyOpen = false, children }) => {
    const [open, setOpen] = React.useState(initiallyOpen);

    return (
        <div className='flex flex-col'>
            <div onClick={ () => setOpen(!open) } className='flex flex-row items-center cursor-pointer'>
                <img
                    src={ open ? '/opened-folder.svg' : '/folder.svg' }
                    className='w-10 h-10 m-1 mr-4'
                />
                <span className='flex flex-col text-xl font-mono'>
                    { name }
                </span>
            </div>
            {
                open ? (
                    Array.isArray(children) ? children.map((child, idx) => (
                        <div key={ idx } className='flex flex-row ml-10'>
                            { child }
                        </div>)
                    ) : (
                        <div className='flex flex-row ml-10'>
                            { children }
                        </div>
                    )
                ) : null
            }
        </div>
    );
}

const ExternalLink = ({ name, icon, href }) => {
    return (
        <MyOutboundLink href={ href } className='flex flex-row items-center cursor-pointer'>
            <img
                src={ icon || '/external-link.svg' }
                className='w-6 h-6 m-2'
            />
            <span className='flex flex-col text-xl font-mono leading-none'>
                { name }
            </span>
        </MyOutboundLink>
    );
}

export default () => {
    return (
        <>
            <Helmet>
                <title>/</title>
            </Helmet>
            <div className='ml-3'>
                <Directory initiallyOpen={ true } name='/'>
                    <Directory initiallyOpen={ true } name='links'>
                        <ExternalLink name='github' icon='/github.png' href='https://github.com/kajchang'/>
                        <ExternalLink name='devpost' icon='/devpost.svg' href='https://devpost.com/kajchang'/>
                        <ExternalLink name='linkedin' icon='/linkedin.png' href='https://www.linkedin.com/in/kai-j-chang'/>
                        <ExternalLink name='strava' icon='/strava.png' href='https://strava.com/athletes/kachang'/>
                    </Directory>
                    <Directory name='projects'>
                        <ExternalLink name='Elo* Ratings for Politicians' href='https://firebrand.kaijchang.com'/>
                        <ExternalLink name='StudentVue APIs' icon='/github.png' href='https://github.com/Studentvue-Community'/>
                        <ExternalLink name='SFPL API' icon='/github.png' href='https://github.com/kajchang/SFPL'/>
                        <ExternalLink name='react-device-mockups' icon='/github.png' href='https://github.com/kajchang/react-device-mockups'/>
                        <Directory name='school related'>
                            <ExternalLink name='2020 Mock Election' href='https://vote.lowellhs.org'/>
                            <ExternalLink name='Teacher Reviews Site' href='https://studentsreview.me'/>
                            <ExternalLink name='Arena Rolodex' href='https://arena.lowellhs.com'/>
                        </Directory>
                        <Directory name='hackathons'>
                            <ExternalLink name='Green Space' href='https://mygreen.space'/>
                        </Directory>
                    </Directory>
                </Directory>
            </div>
        </>
    )
};
