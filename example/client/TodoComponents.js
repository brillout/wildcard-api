import React from 'react';

export {TodoCheckbox};
export {TodoText};

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
      style={{textDecoration: todo.completed && 'line-through'}}
    >
      {todo.text}
    </span>
  );
}

