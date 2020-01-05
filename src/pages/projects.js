import React from 'react';
import { Card, CardBody, CardText, Col, Row } from 'reactstrap';
import GithubButton from 'react-github-btn';
import GatsbyImage from 'gatsby-image';
import Helmet from 'react-helmet';

import { graphql } from 'gatsby';

const Project = ({ fluid, repo, link, description, techonologies }) => (
    <Card>
        <a href={ link } target='_blank' rel='noopener noreferrer'>
            <CardBody>
                <GatsbyImage fluid={ fluid } style={ { maxWidth: 550 } }/>
                <CardText className='my-1'>
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
                    <br/>
                    <b>{ techonologies.join(', ') }</b>
                    <br/>
                    { description }
                </CardText>
            </CardBody>
        </a>
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
                    <Col md={ 4 } sm={ 6 }>
                        <Project
                            fluid={ getImage('students-review') }
                            techonologies={ [ 'MERN (w/ gatsby)', 'python', 'graphql' ] }
                            repo='kajchang/studentsreview.me'
                            link='https://studentsreview.me'
                            description='Building a website for Lowell High School students to see what which classes teachers teach and read and write reviews for teachers.'
                        />
                    </Col>
                    <Col md={ 4 } sm={ 6 }>
                        <Project
                            fluid={ getImage('studentvue') }
                            techonologies={ [ 'python', 'web scraping' ] }
                            repo='kajchang/StudentVue'
                            link='https://github.com/kajchang/StudentVue'
                            description="Building an interface for students to programmatically query data from their district's student portal for their own applications."
                        />
                    </Col>
                    <Col md={ 4 } sm={ 6 }>
                        <Project
                            fluid={ getImage('sfpl') }
                            techonologies={ [ 'python', 'web scraping' ] }
                            repo='kajchang/SFPL'
                            link='https://github.com/kajchang/SFPL'
                            description='Building San Franciscans to programmatically query library data and perform actions such as holding books.'
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
