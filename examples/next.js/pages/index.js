import React, { Component } from "react";
import Link from "next/link";
import { server } from "telefunc/client";

export default class extends Component {
  static async getInitialProps() {
    const posts = await server.getPostList();
    return { posts };
  }

  render() {
    const { posts } = this.props;
    return (
      <ul>
        {posts.map(({ id, title }) => (
          <li key={id}>
            <Link
              href={{ pathname: "/posts", query: { id } }}
              as={"/posts/" + id}
            >
              <a>{title}</a>
            </Link>
          </li>
        ))}
      </ul>
    );
  }
}
