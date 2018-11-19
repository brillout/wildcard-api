import React from 'react';
import {endpoints} from 'wildcard-api/client';

export default createTodoView;

function createTodoView(todo, data, setData) {
    return (
      <div key={todo.id}>
        <TodoCheckbox todo={todo} onChange={onCompleteToggle}/>
        <TodoText todo={todo}/>
      </div>
    );

    async function onCompleteToggle() {
      const completed = await endpoints.toggleComplete(todo.id);
      setData({
        ...data,
        todos: data.todos.map(_todo => {
          if( _todo.id === todo.id ) {
            return {..._todo, completed};
          }
          return _todo;
        })
      });
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

