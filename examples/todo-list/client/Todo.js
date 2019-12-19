import React from 'react';
import {endpoints} from '@wildcard-api/client';
import {TodoCheckbox, TodoText} from './TodoComponents';

export default Todo;

function Todo({todo, updateTodo}) {
    return (
      <div>
        <TodoCheckbox todo={todo} onChange={onCompleteToggle}/>
        <TodoText todo={todo}/>
      </div>
    );

    async function onCompleteToggle() {
      const completed = await endpoints.toggleComplete(todo.id);
      updateTodo(todo, {completed});
    }
}
