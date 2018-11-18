import "babel-polyfill";
import React, { useState, useEffect } from 'react';
import {endpoints} from '../../client';
import createTodo from './createTodo';
import renderPage from './renderPage';

renderPage(<LandingPage/>);

function LandingPage() {
  const [data, setData] = useState(null);

  loadData();

  if( data === null ) {
    return 'Loading...';
  }

  const {todos, user} = data;

  return (
    <div>
      <div>
        Completed todos:
        <div>
          {todos.map(todo => createTodo(todo, data, setData))}
        </div>
      </div>
    </div>
  );

  function loadData() {
    useEffect(() => {
      (async () => {
        const data = await endpoints.getCompletedPageData();
        setData(data);
      })();
    }, {});
  }

}
