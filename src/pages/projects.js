import React from 'react';
import { Card, CardTitle, CardBody, CardText, Col, Row } from 'reactstrap';
import GitHubButton from 'react-github-btn';
import GatsbyImage from 'gatsby-image';
import Helmet from 'react-helmet';

import { graphql } from 'gatsby';

const Project = ({ fluid, title, repo, link, description, technologies }) => (
    <Card className='my-1'>
        <CardBody>
            <GatsbyImage fluid={ fluid } style={ { maxWidth: 550, margin: '0 auto' } }/>
            <CardTitle>
                <h3>{ title }</h3>
                <i className='fas fa-link mr-1'/>
                <a href={ link } target='_blank' rel='noopener noreferrer'>
                    { (new URL(link)).hostname }
                </a>
                <br/>
                <GitHubButton
                    href={ 'https://github.com/' + repo }
                    data-show-count={ true } data-icon='octicon-star'
                >
                    Star
                </GitHubButton>
                <GitHubButton
                    href={ 'https://github.com/' + repo + '/fork' }
                    data-show-count={ true } data-icon='octicon-repo-forked'
                >
                    Fork
                </GitHubButton>
            </CardTitle>
            <CardText>
                <b>description:</b> { description }
                <br/>
                <b>technologies:</b> { technologies.join(', ') }
            </CardText>
        </CardBody>
    </Card>
);

export default ({ data }) => {
    const images = data.allFile.edges;

    const getImage = name => images.find(({ node }) => node.name === name).node.childImageSharp.fluid;

    return (
        <>
            <Helmet>
                <title>kachang's projects</title>
            </Helmet>
            <main className='d-flex flex-wrap' id='main'>
                <Row>
                    <Col md={ 6 } sm={ 12 }>
                        <Project
                            fluid={ getImage('students-review') }
                            title='Students Review'
                            repo='kajchang/studentsreview.me'
                            link='https://studentsreview.me'
                            description='Collects and displays constructive reviews and class offering data for teachers at Lowell High School.'
                            technologies={ ['MERN (w/ gatsby)', 'graphql'] }
                        />
                    </Col>
                    <Col md={ 6 } sm={ 12 }>
                        <Project
                            fluid={ getImage('studentvue') }
                            title='StudentVue'
                            repo='kajchang/StudentVue'
                            link='https://github.com/kajchang/StudentVue'
                            description='Allows students to programmatically query their schedule and grade data on the StudentVue by Synergy platform.'
                            technologies={ ['bs4'] }
                        />
                    </Col>
                    <Col md={ 6 } sm={ 12 }>
                        <Project
                            fluid={ getImage('sfpl') }
                            title='SFPL'
                            repo='kajchang/SFPL'
                            link='https://github.com/kajchang/SFPL'
                            description='Allows San Franciscans to programmatically query library data and perform actions such as holding books.'
                            technologies={ ['bs4'] }
                        />
                    </Col>
                    <Col md={ 6 } sm={ 12 }>
                        <Project
                            fluid={ getImage('college-mail-analyzer') }
                            title='College Mail Analyzer'
                            repo='kajchang/college-mail-analyzer'
                            link='https://college.kaijchang.com'
                            description="Analyzes college emails loaded from your Gmail account using data scraped from US News' college rankings."
                            technologies={ ['d3', 'google apis'] }
                        />
                    </Col>
                </Row>
            </main>
        </>
    )
};


export const query = graphql`
    query {
        allFile(filter: {
            relativeDirectory: { eq: "projects" }
        }) {
  	        edges {
            	node {
            	    name
              	    childImageSharp {
                	    fluid(maxWidth: 550) {
                  	        ...GatsbyImageSharpFluid
              		    }
  	        		}
  	        	}
  	        }
        }
    }
`;
