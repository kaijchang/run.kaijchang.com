import React from 'react';

import InstagramEmbed from 'react-instagram-embed';

import '../styles/layout.css';

const ElectionsSummary = () => (
  <div className='flex flex-col font-mono md:w-1/3 mx-6 mb-6'>
    <h1 className='text-4xl mb-6'>Elections & Politics</h1>
    <a href='#' className='link-underline text-xl'>LHS Mock Election</a>
    <a href='#' className='link-underline text-xl'>Firebrand</a>
  </div>
);

const ElectionsBody = () => (
  <div className='flex flex-col md:w-2/3 mr-6'>
    <div className='flex flex-col sm:flex-row'>
      <div className='flex flex-col self-stretch justify-start'>
        <h2 className='text-3xl font-mono mb-6'>LHS Mock Election</h2>
        <div className='text-lg font-sans break-word sm:mr-6 py-3'>
          <p>
            One day before <b>Super Tuesday</b>, when Californians voted in the <b>Presidential Primaries</b>, I helped to organize and run <b>Lowell High School's</b> first Mock Election.
          </p>
          <br/>
          <p>
            The goal of the event was to give students a fun, actionable way to express their political views and to get a sense of how Lowell's student body's political views compared to San Francisco and California as a whole.
          </p>
          <br/>
          <p>
            We used <b>Instant Runoff Voting</b> for the primary candidates and also polled students on their demographics, highest priority issues and news sources and hosted the results on a <a href='https://vote.lowellhs.org' className='link-underline'>website</a> I made.
          </p>
        </div>
      </div>
      <InstagramEmbed
        url='https://instagr.am/p/B9OCK0KAJqI'
        hideCaption={true}
        maxWidth={320}
        injectScript
      />
    </div>
  </div>
);

export default () => (
  <>
    <div className='flex flex-col md:flex-row justify-around my-6'>
      <ElectionsSummary/>
      <ElectionsBody/>
    </div>
  </>
);
