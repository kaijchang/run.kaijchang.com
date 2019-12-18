import React  from 'react';
import { Container, Nav, Navbar, NavItem } from 'reactstrap';
import { Link } from 'gatsby';

import { graphql, useStaticQuery } from 'gatsby';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'typeface-roboto';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles/layout.css';

export default ({ children }) => {
    const data = useStaticQuery(graphql`
        query {
            site {
                siteMetadata {
                    blogUrl
                    githubUrl
                    linkedinUrl
                }
            }
        }
    `);

    const siteMetadata = data.site.siteMetadata;

    return (
        <Container fluid>
            <Navbar light expand='md'>
                <Link to='/'><h4>Home</h4></Link>
                <div style={ { flexGrow: 1 } }/>
                <Nav>
                    <NavItem className='mx-3'><Link to='/projects'>Projects</Link></NavItem>
                    <NavItem className='mx-3'><Link to='/'>CTFs</Link></NavItem>
                    <NavItem className='mx-3'>
                        <a href={ siteMetadata.blogUrl } target='_blank' rel='noopener noreferrer'>Blog</a>
                    </NavItem>
                </Nav>
            </Navbar>
            { children }
            <Navbar light expand='md'>
                <Nav>
                    <NavItem className='mr-3'>© 2019 Kai Chang</NavItem>
                    <NavItem className='mr-3'>
                        <a href={ siteMetadata.githubUrl } target='_blank' rel='noopener noreferrer'>Github</a>
                    </NavItem>
                    <NavItem className='mr-3'>
                        <a href={ siteMetadata.linkedinUrl } target='_blank' rel='noopener noreferrer'>Linkedin</a>
                    </NavItem>
                </Nav>
            </Navbar>
        </Container>
    );
}
