import React from 'react';
import Helmet from 'react-helmet';
import { Col, Row } from 'reactstrap';
import Project from '../components/Project';

import { graphql } from 'gatsby';

export default ({ data }) => {
    const images = data.allFile.edges;

    const getImage = name => images.find(({ node }) => node.name === name).node.childImageSharp.fluid;

    return (
        <>
            <Helmet>
                <title>kachang's site</title>
            </Helmet>
            <main className='d-flex flex-column' id='main'>
                <div className='d-flex flex-column' style={ { height: '50vh' } }>
                    <div style={ { flexGrow: 1 } }/>
                    <h1 className='caret'>Kai Chang</h1>
                    <div style={ { flexGrow: 1 } }/>
                </div>
                <Row className='d-flex justify-content-around' style={ { background: '#766ec8' } }>
                    <Col sm={ 12 }>
                        <h1 className='my-5' style={ { color: 'white', textAlign: 'center' } }>Projects</h1>
                    </Col>
                    <Col md={ 6 } sm={ 10 } className='my-2 mx-1'>
                        <Project
                            fluid={ getImage('students-review') }
                            name='studentsreview.me'
                            repo='kajchang/studentsreview.me'
                            link='https://studentsreview.me'
                            description='Website for Lowell High School students to see what which classes teachers teach and read and write reviews for teachers.'
                        />
                    </Col>
                    <Col md={ 6 } sm={ 10 } className='my-2 mx-1'>
                        <Project
                            fluid={ getImage('mock-primary') }
                            name='Lowell Mock Primary'
                            link='https://vote.lowellhs.org'
                            description="Interactive website to view primary results from Lowell's Mock Primary that I co-organized."
                        />
                    </Col>
                    <Col md={ 6 } sm={ 10 } className='my-2 mx-1'>
                        <Project
                            fluid={ getImage('studentvue') }
                            name='StudentVue API'
                            repo='kajchang/StudentVue'
                            link='https://github.com/kajchang/StudentVue'
                            description="Interface for students to programmatically query data from their district's student portal for their own applications."
                        />
                    </Col>
                    <Col md={ 6 } sm={ 10 } className='my-2 mx-1'>
                        <Project
                            fluid={ getImage('sfpl') }
                            name='SFPL API'
                            repo='kajchang/SFPL'
                            link='https://github.com/kajchang/SFPL'
                            description='Interface for San Franciscans to programmatically query library data and perform actions such as holding books.'
                        />
                    </Col>
                    <Col sm={ 12 } className='my-5'></Col>
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
