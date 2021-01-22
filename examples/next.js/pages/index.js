import React, { Component } from "react";
import Link from "next/link";
import { server as posts } from "telefunc/client";

export default class extends Component {
  static async getInitialProps() {
    const postList = await posts.getPostList();
    return { postList };
  }

  render() {
    const { postList } = this.props;
    return (
      <ul>
        {postList.map(({ id, title }) => (
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
