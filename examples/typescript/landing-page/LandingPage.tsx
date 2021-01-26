import React from "react";
import { context } from "telefunc/client";
import { UserPosts } from "../posts/views";
import { LoginForm, LogoutButton } from "../users/views";

export { LandingPage };

function LandingPage() {
  return (
    <div style={{ margin: "auto", width: 600 }}>
      <Content />
    </div>
  );
}

function Content() {
  if (!context.user) {
    return <LoginForm />;
  }
  return (
    <>
      <div>
        <LogoutButton />
        <br />
        <br />
      </div>
      <div>
        <UserPosts />
      </div>
    </>
  );
}
