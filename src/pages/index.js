import React, { useState } from 'react';
import { Container, Nav, Navbar, NavItem } from 'reactstrap';
import { graphql, Link, useStaticQuery } from 'gatsby';

export default () => {
    const data = useStaticQuery(graphql`
        query {
            site {
                siteMetadata {
                    blogUrl
                }
            }
        }
    `);

    return (
        <Container fluid>
            <Navbar light expand='md'>
                <Link to='/'><h4>Home</h4></Link>
                <div style={ { flexGrow: 1 } }/>
                <Nav>
                    <NavItem className='mx-4'><Link to='/'>Projects</Link></NavItem>
                    <NavItem className='mx-4'><Link to='/'>CTFs</Link></NavItem>
                    <NavItem className='mx-4'>
                        <a href={ data.site.siteMetadata.blogUrl } target='_blank' rel='noopener noreferrer'>Blog</a>
                    </NavItem>
                </Nav>
            </Navbar>
            <main className='d-flex flex-column' id='main'>
                <div style={ { flexGrow: 1 } }/>
                <div style={ { margin: '0 auto' } }><h1 className='typewriter'>Kai Chang</h1></div>
                <div style={ { flexGrow: 3 } }/>
            </main>
        </Container>
    )
};
