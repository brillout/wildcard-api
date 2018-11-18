import React from 'react';
import renderPage from './renderPage';
import LoadingWrapper from './LoadingWrapper';
import {endpoints} from '../../client';
import createTodo from './createTodo';

renderPage(<CompletedPage/>);

function CompletedPage() {
  return (
    <LoadingWrapper fetchData={endpoints.getCompletedPageData}>{
      ({data, setData}) => <React.Fragment>
        Completed todos:
        <div>
          {data.todos.map(todo => createTodo(todo, data, setData))}
        </div>
      </React.Fragment>
    }</LoadingWrapper>
  );
}
