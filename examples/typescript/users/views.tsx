import React, { FormEvent } from "react";
import { context, server } from "telefunc/client";

export { LoginForm, LogoutButton };

function LoginForm() {
  const email = "test@example.org";
  const password = "9u210)S(@)@s211";
  return (
    <form onSubmit={login}>
      <fieldset style={{ border: 0 }}>
        Email: <input type="text" value={email} readOnly />
        <br />
        Password: <input type="text" value={password} readOnly />
        <br />
        <br />
        <button type="submit">Sign In</button>
      </fieldset>
    </form>
  );
  async function login(ev: FormEvent) {
    ev.preventDefault();
    await server.login(email, password);
    window.location.reload();
  }
}

function LogoutButton() {
  return (
    <button onClick={logout} type="button">
      Logout
    </button>
  );
  function logout() {
    delete context.user;
    window.location.reload();
  }
}
