import React, { Component } from "react";
import { server as posts } from "telefunc/client";

export default class extends Component {
  static async getInitialProps({ query: { id } }) {
    const postId = id;
    const { title, content, noPostFound } = await posts.getPostData({
      postId,
    });
    return { title, content, noPostFound, postId };
  }

  render() {
    const { title, content, noPostFound, postId } = this.props;
    if (noPostFound) {
      return (
        <div>
          No post with id <b>{postId}</b> found.
        </div>
      );
    }
    return (
      <div>
        <h1>{title}</h1>
        <p>{content}</p>
      </div>
    );
  }
}
