import {useContext, useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {formatISO9075} from "date-fns";
import {UserContext} from "../UserContext";
import {Link} from 'react-router-dom';
import axios from "axios"; // Import axios to make requests

export default function PostPage() {
  const [postInfo,setPostInfo] = useState(null);
  const [comments, setComments] = useState([]); // Create a state variable to store the comments array
  const {userInfo} = useContext(UserContext);
  const {id} = useParams();
  useEffect(() => {
    fetch(`http://localhost:4000/post/${id}`)
      .then(response => {
        response.json().then(postInfo => {
          setPostInfo(postInfo);
        });
      });
    // Fetch the comments from the server when the component mounts
    axios.get(`http://localhost:4000/comments/${id}`)
      .then(res => {
        setComments(res.data);
      })
      .catch(err => {
        console.error(err);
      });
  }, [id]);

  if (!postInfo) return '';

  // Handle the submit event of the comment form
  const handleSubmit = (e) => {
    e.preventDefault();
    // Get the comment text from the input field
    const commentText = e.target.elements.comment.value;
    // Create a new comment object with the current user and date
    const newComment = {
      text: commentText,
      user: userInfo.username,
      date: new Date()
    };
    // Send the new comment to the server
    axios.post(`http://localhost:4000/comments/${id}`, newComment)
      .then(res => {
        // Update the comments state with the new comment
        setComments([...comments, res.data]);
        // Clear the input field
        e.target.elements.comment.value = "";
      })
      .catch(err => {
        console.error(err);
      });
  };

  // Handle the delete event of a comment
  const handleDelete = (commentId) => {
    // Send a delete request to the server
    axios.delete(`http://localhost:4000/comments/${id}/${commentId}`)
      .then(res => {
        // Filter out the deleted comment from the comments state
        setComments(comments.filter(comment => comment._id !== commentId));
      })
      .catch(err => {
        console.error(err);
      });
  };

  return (
    <div className="post-page">
      <h1>{postInfo.title}</h1>
      <time>{formatISO9075(new Date(postInfo.createdAt))}</time>
      <div className="author">by @{postInfo.author.username}</div>
      {userInfo.id === postInfo.author._id && (
        <div className="edit-row">
          <Link className="edit-btn" to={`/edit/${postInfo._id}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Edit this post
          </Link>
        </div>
      )}
      <div className="image">
        <img src={`http://localhost:4000/${postInfo.cover}`} alt=""/>
      </div>
      <div className="content" dangerouslySetInnerHTML={{__html:postInfo.content}} />
      {/* Add a comment form below the post */}
      <div className="comment-form">
        <form onSubmit={handleSubmit}>
          <input type="text" name="comment" placeholder="Write a comment..." required/>
          <button type="submit">Post</button>
        </form>
      </div>
      <div className="comment-list">
        {comments.map(comment => (
          <div key={comment._id} className="comment">
            <p className="user">{comment.user}</p>
            <p className="text">{comment.text}</p>
            <p className="date">{formatISO9075(new Date(comment.date))}</p>
            {userInfo.username === postInfo.author.username && (
              <button onClick={() => handleDelete(comment._id)}>Delete</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
