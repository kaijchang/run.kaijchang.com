import React from 'react';
import Helmet from 'react-helmet';

export default () => {
    return (
        <>
            <Helmet>
                <title>kachang's site</title>
            </Helmet>
            <main className='d-flex flex-column' id='main'>
                <div style={ { flexGrow: 1 } }/>
                <h1 className='caret'>Kai Chang</h1>
                <div style={ { flexGrow: 3 } }/>
            </main>
        </>
    )
};
