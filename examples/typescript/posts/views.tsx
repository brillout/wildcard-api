import React from "react";
import { useEffect, useState } from "react";
import { server } from "telefunc/client";
import { Post } from "./types";

export { UserPosts };

function UserPosts() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  useEffect(() => {
    (async () => {
      const posts = await server.getPosts();
      setPosts(posts);
    })();
  }, []);

  if (posts === null) {
    return <>Loading...</>;
  }

  return (
    <>
      {posts.map((post) => (
        <PostView key={post.id} post={post} />
      ))}
    </>
  );
}

function PostView({ post }: { post: Post }) {
  return (
    <>
      <h2>{post.title}</h2>
      <div>{post.content}</div>
      <br />
    </>
  );
}
