import React from 'react';
import { Card, CardTitle, CardBody, CardText, Col, Row } from 'reactstrap';
import GatsbyImage from 'gatsby-image';
import Helmet from 'react-helmet';

import { graphql } from 'gatsby';

const CTF = ({ fluid, name, description, dates, rank }) => (
    <Card className='my-1'>
        <CardBody>
            <GatsbyImage fluid={ fluid } style={ { maxWidth: 550, margin: '0 auto' } }/>
            <CardTitle>
                <h3>{ name }</h3>
            </CardTitle>
            <CardText>
                <b>dates:</b> { dates[0].toLocaleDateString() } - { dates[1].toLocaleDateString() }
                <br/>
                <b>rank:</b> { rank[0] }/{ rank[1] }
                <br/>
                <b>description:</b> { description }
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
                <title>kachang's ctfs</title>
            </Helmet>
            <main className='d-flex flex-wrap' id='main'>
                <Row>
                    <Col>
                        <CTF
                            fluid={ getImage('xmas-ctf-2019') }
                            name='X-MAS CTF 2019'
                            description="This was my first CTF ever, and I want to thank all the organizers for making it super fun! I mostly focused on the web exploitation section because that's what I have the most prior knowledge of, but I really enjoyed attempting a lot of the binary exploitation / reverse engineering challenges as well."
                            dates={ [new Date('12/13/19'), new Date('12/20/19')] }
                            rank={ [79, 2432] }
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
            relativeDirectory: { eq: "ctfs" }
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
