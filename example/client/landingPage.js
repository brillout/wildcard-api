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

  loadData();

  if( data === null ) {
    return 'Loading...';
  }

  const {todos, user} = data;

  return (
    <div>
      <div>
        Hi, {user.username}.
        <br/>
        <br/>
        Your todos are:
        <div>
          {todos.map(Todo)}
        </div>
      </div>
    </div>
  );

  function loadData() {
    useEffect(() => {
      (async () => {
        const data = await endpoints.getLandingPageData();
        setData(data);
      })();
    }, {});
  }

  function Todo(todo) {
      return (
        <div key={todo.id}>
          <TodoCheckbox todo={todo} onChange={onCompleteToggle}/>
          <TodoText todo={todo}/>
        </div>
      );

      async function onCompleteToggle() {
        const todoUpdated = await endpoints.toggleComplete(todo.id);
        const todosUpdated = (
          todos
          .map(todo => {
            if( todo.id === todoUpdated.id ) {
              return todoUpdated;
            }
            return todo;
          })
        );
        setData({...data, todos: todosUpdated});
      }
  }
}

function TodoCheckbox({todo, onChange}) {
  return (
    <input
      type="checkbox"
      checked={todo.completed}
      onChange={onChange}
      style={{cursor: 'pointer'}}
    />
  );
}

function TodoText({todo}) {
  return (
    <span
      style={{textDecoration: todo.completed&&'line-through'}}
    >
      {todo.text}
    </span>
  );
}
