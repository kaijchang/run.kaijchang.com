import React from 'react';

const ElectionsSummary = () => (
  <div className='flex flex-col font-mono'>
    <h1 className='text-4xl mb-6'>Elections & Politics</h1>
    <a href='#' className='link-underline text-xl'>LHS Mock Election</a>
    <a href='#' className='link-underline text-xl'>Firebrand</a>
  </div>
);

const ElectionsBody = () => (
  <div>
    Hello
  </div>
);

export default () => (
  <>
    <div className='flex flex-col md:flex-row justify-around my-6'>
      <ElectionsSummary/>
      <div className='md:mx-3'/>
      <ElectionsBody/>
    </div>
  </>
);
