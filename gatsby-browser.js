import React from 'react';
import Layout from './src/layout';

export const wrapPageElement = ({ element }) => <Layout>
    { element }
</Layout>;
