import React from 'react';
import renderPage from './renderPage';
import LoadingWrapper from './LoadingWrapper';
import {endpoints} from 'wildcard-api/client';
import createTodoView from './createTodoView';

renderPage(<CompletedPage/>);

function CompletedPage() {
  return (
    <LoadingWrapper fetchData={endpoints.getCompletedPageData}>{
      ({data, setData}) => <React.Fragment>
        Completed todos:
        <div>
          {data.todos.map(todo => createTodoView(todo, data, setData))}
        </div>
      </React.Fragment>
    }</LoadingWrapper>
  );
}
