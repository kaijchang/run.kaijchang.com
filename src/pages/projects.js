import React from 'react';
import { Card, CardTitle, CardBody, CardText, Col, Row } from 'reactstrap';
import GatsbyImage from 'gatsby-image';
import Helmet from 'react-helmet';

import { graphql } from 'gatsby';

const Project = ({ fluid, title, link, description, technologies }) => (
    <Card>
        <CardBody>
            <GatsbyImage fluid={ fluid }/>
            <CardTitle>
                <h3>{ title }</h3>
                <i className='fas fa-link mr-1'/>
                <a href={ link } target='_blank' rel='noopener noreferrer'>
                    { (new URL(link)).hostname }
                </a>
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
                <title>Projects</title>
            </Helmet>
            <main className='d-flex flex-column' id='main'>
                <Row>
                    <Col lg={ 6 } md={ 12 }>
                        <Project
                            fluid={ getImage('students-review') }
                            title='Students Review'
                            link='https://studentsreview.me'
                            description='Collects and displays constructive reviews and class offering data for teachers at Lowell High School.'
                            technologies={ ['MERN (w/ gatsby)', 'graphql'] }
                        />
                    </Col>
                    <Col lg={ 6 } md={ 12 }>
                        <Project
                            fluid={ getImage('college-mail-analyzer') }
                            title='College Mail Analyzer'
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
                	    fluid(maxWidth: 1200) {
                  	        ...GatsbyImageSharpFluid
              		    }
  	        		}
  	        	}
  	        }
        }
    }
`;
