import React, { useState, useEffect } from "react";

export default LoadingWrapper;

function LoadingWrapper({ fetchData, children: renderContent }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const fetchedData = await fetchData();
      setData(fetchedData);
    })();
  }, []);

  if (data === null) {
    return "Loading...";
  }

  return renderContent({ data, updateTodo });

  function updateTodo(todo, newValues) {
    setData({
      ...data,
      todos: data.todos.map((_todo) => {
        if (_todo.id === todo.id) {
          return { ..._todo, ...newValues };
        }
        return _todo;
      }),
    });
  }
}
