import React from "react";
import { server } from "telefunc/client";
import { TodoCheckbox, TodoText } from "./TodoComponents";

export default Todo;

function Todo({ todo, updateTodo }) {
  return (
    <div>
      <TodoCheckbox todo={todo} onChange={onCompleteToggle} />
      <TodoText todo={todo} />
    </div>
  );

  async function onCompleteToggle() {
    const completed = await server.toggleComplete(todo.id);
    updateTodo(todo, { completed });
  }
}
