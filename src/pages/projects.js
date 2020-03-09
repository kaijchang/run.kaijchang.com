import React from 'react';
import { Card, CardBody, CardText, Col, Row } from 'reactstrap';
import GithubButton from 'react-github-btn';
import GatsbyImage from 'gatsby-image';
import Helmet from 'react-helmet';

import { graphql } from 'gatsby';

const Project = ({ fluid, name, repo, link, description }) => (
    <Card>
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
                            name='studentsreview.me'
                            repo='kajchang/studentsreview.me'
                            link='https://studentsreview.me'
                            description='Website for Lowell High School students to see what which classes teachers teach and read and write reviews for teachers.'
                        />
                    </Col>
                    <Col md={ 6 } sm={ 12 }>
                        <Project
                            fluid={ getImage('mock-primary') }
                            name='Lowell Mock Primary'
                            link='https://vote.lowellhs.org'
                            description="Interactive website to view primary results from Lowell's Mock Primary that I co-organized."
                        />
                    </Col>
                    <Col md={ 6 } sm={ 12 }>
                        <Project
                            fluid={ getImage('studentvue') }
                            name='StudentVue API'
                            repo='kajchang/StudentVue'
                            link='https://github.com/kajchang/StudentVue'
                            description="Interface for students to programmatically query data from their district's student portal for their own applications."
                        />
                    </Col>
                    <Col md={ 6 } sm={ 12 }>
                        <Project
                            fluid={ getImage('sfpl') }
                            name='SFPL API'
                            repo='kajchang/SFPL'
                            link='https://github.com/kajchang/SFPL'
                            description='Interface for San Franciscans to programmatically query library data and perform actions such as holding books.'
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
                	    fluid(maxWidth: 400) {
                  	        ...GatsbyImageSharpFluid
              		    }
  	        		}
  	        	}
  	        }
        }
    }
`;
