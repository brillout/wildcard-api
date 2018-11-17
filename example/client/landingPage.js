import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {endpoints} from '../../client';
import "babel-polyfill";

ReactDOM.render(
  <LandingPage/>,
  document.body.appendChild(document.createElement('div'))
);

function LandingPage() {
  const [data, setData] = useState(null);

  if( data === null ) {
    useEffect(() => {
      (async () => {
        const data = await endpoints.getLandingPageData();
        setData(data);
      })();
    });

    return 'Loading...';
  }

  return (
    <div>{
      data.todos.map(({id, text}) => <div key={id}>{text}</div>)
    }</div>
  );
}
