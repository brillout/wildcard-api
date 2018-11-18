import React from 'react';
import renderPage from './renderPage';
import LoadingWrapper from './LoadingWrapper';
import {endpoints} from '../../client';
import createTodo from './createTodo';

renderPage(<LandingPage/>);

function LandingPage() {
  return (
    <LoadingWrapper fetchData={endpoints.getLandingPageData}>{
      ({data, setData}) => <React.Fragment>
        Hi, {data.user.username}.
        <br/>
        <br/>
        Your todos are:
        <div>
          {data.todos.map(todo => createTodo(todo, data, setData))}
        </div>
        <br/>
        Your completed todos: <a href="/completed">/completed</a>.
      </React.Fragment>
    }</LoadingWrapper>
  );
}
