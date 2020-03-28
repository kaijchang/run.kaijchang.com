import React from 'react';
import { Card, CardBody, CardText } from 'reactstrap';
import GithubButton from 'react-github-btn';
import GatsbyImage from 'gatsby-image';

const Project = ({ fluid, name, repo, link, description }) => (
    <Card style={ { borderRadius: '1rem', border: 0 } }>
        <CardBody>
            <GatsbyImage fluid={ fluid } style={ { maxWidth: 400, margin: 'auto' } }/>
            <CardText className='my-1'>
                <h3 style={ { display: 'inline', marginRight: 10 } }>{ name }</h3>
                { repo ? <>
                        <span className='mr-1'>
                            <GithubButton
                                href={ 'https://github.com/' + repo }
                                data-show-count={ true } data-icon='octicon-star'
                            >Star</GithubButton>
                        </span>
                    <GithubButton
                        href={ `https://github.com/${ repo }/fork` }
                        data-show-count={ true } data-icon='octicon-repo-forked'
                    >Fork</GithubButton>
                </> : null }
                <br/>
                { description }
                <br/>
                <a href={ link } target='_blank' rel='noopener noreferrer' style={ { color: 'blue' } }>{ (new URL(link)).hostname }</a>
            </CardText>
        </CardBody>
    </Card>
);

export default Project;
