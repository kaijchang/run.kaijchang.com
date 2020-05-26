import React, { useEffect, useState } from "react"
import Helmet from 'react-helmet';
import Marquee from 'react-double-marquee';

import moment from 'moment';

export default () => {
    const [feed, setFeed] = useState([]);

    useEffect(() => {
        fetch('https://api.github.com/users/kajchang/events/public')
            .then(res => res.json())
            .then(data => {
                for (let datum of data) {
                    const timestamp = moment(datum.created_at);
                    if (datum.type === 'PushEvent') {
                        setFeed(feed => [...feed, [<a href={ 'https://github.com/' + datum.repo.name + '/commit/' + datum.payload.head }>
                            pushed { datum.payload.head.substr(0, 6) } to { datum.repo.name } {
                            moment.duration(moment(timestamp).diff(moment())).humanize(true) }
                        </a>, timestamp]]);
                    } else if (datum.type === 'CreateEvent' && datum.payload.ref_type === 'repository') {
                        setFeed(feed => [...feed, [<a href={ 'https://github.com/' + datum.repo.name }>
                            created { datum.repo.name } { moment.duration(moment(timestamp).diff(moment())).humanize(true) }
                        </a>, timestamp]]);
                    }
                }
            });

        fetch('https://cors-anywhere.herokuapp.com/https://feedmyride.net/activities/57977907')
            .then(res => {
                const reader = res.body.getReader();
                return new ReadableStream({
                    start(controller) {
                        return pump();
                        function pump() {
                            return reader.read().then(({ done, value }) => {
                                // When no more data needs to be consumed, close the stream
                                if (done) {
                                    controller.close();
                                    return;
                                }
                                // Enqueue the next data chunk into our target stream
                                controller.enqueue(value);
                                return pump();
                            });
                        }
                    }
                })
            })
            .then(stream => new Response(stream))
            .then(response => response.blob())
            .then(blob => blob.text())
            .then(text => {
                const rssFeed = new window.DOMParser().parseFromString(text, 'text/xml');
                for (let item of rssFeed.getElementsByTagName('item')) {
                    console.log(item.getElementsByTagName('title')[0].textContent);
                    const timestamp = moment(item.getElementsByTagName('pubDate')[0].textContent);
                    setFeed(feed => [...feed, [<a href={ item.getElementsByTagName('link')[0].textContent }>
                        { /Distance: ([0-9.]+km)/.exec(item.getElementsByTagName('description')[0].textContent)[1] }
                        { ' ' }{ item.getElementsByTagName('title')[0].textContent }
                        { ' ' }{ moment.duration(moment(timestamp).diff(moment())).humanize(true) }
                    </a>, timestamp]])
                }
            });
    }, []);

    return (
        <>
            <Helmet>
                <title>website</title>
            </Helmet>
            <div className='flex flex-col justify-center h-screen mx-auto text-center'>
                <h1 className='text-3xl'>Kai Chang • 张俊洙</h1>
                <h3 className='text-lg'>San Francisco, California</h3>
                <div className='whitespace-no-wrap w-full'>
                    <Marquee delay={ 0 } direction='left' speed={ 0.15 }>
                        { feed.length > 2 ? feed
                                .sort((a, b) => b[1].diff(a[1]))
                                .reduce((acc, cur) => [acc, ' | ', cur[0]], [])
                            : null
                        }
                    </Marquee>
                </div>
            </div>
        </>
    )
};
