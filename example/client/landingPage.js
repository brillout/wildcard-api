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

  useEffect(() => {
    (async () => {
      const data = await endpoints.getLandingPageData();
      setData(data);
    })();
  }, {});

  if( data === null ) {
    return 'Loading...';
  }

  const {todos, user} = data;

  return (
    <div>{
      todos.map(({id, text}) => <div key={id}>{text}</div>)
    }</div>
  );
}
