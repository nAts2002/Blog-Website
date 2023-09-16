const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment'); // Import the comment model
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');

const salt = bcrypt.genSaltSync(10);
const secret = 'asdfe45we45w345wegw345werjktjwertkj';

app.use(cors({credentials:true,origin:'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

mongoose.connect('mongodb+srv://admin:minh0915@cluster0.p8yxwn8.mongodb.net/?retryWrites=true&w=majority');

app.post('/register', async (req,res) => {
  const {username,password} = req.body;
  try{
    const userDoc = await User.create({
      username,
      password:bcrypt.hashSync(password,salt),
    });
    res.json(userDoc);
  } catch(e) {
    console.log(e);
    res.status(400).json(e);
  }
});

app.post('/login', async (req,res) => {
  const {username,password} = req.body;
  const userDoc = await User.findOne({username});
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    // logged in
    jwt.sign({username,id:userDoc._id}, secret, {}, (err,token) => {
      if (err) throw err;
      res.cookie('token', token).json({
        id:userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json('wrong credentials');
  }
});

app.get('/profile', (req,res) => {
  const {token} = req.cookies;
  jwt.verify(token, secret, {}, (err,info) => {
    if (err) throw err;
    res.json(info);
  });
});

app.post('/logout', (req,res) => {
  res.cookie('token', '').json('ok');
});

app.post('/post', uploadMiddleware.single('file'), async (req,res) => {
  const {originalname,path} = req.file;
  const parts = originalname.split('.');
  const ext = parts[parts.length - 1];
  const newPath = path+'.'+ext;
  fs.renameSync(path, newPath);

  const {token} = req.cookies;
  jwt.verify(token, secret, {}, async (err,info) => {
    if (err) throw err;
    const {title,summary,content} = req.body;
    const postDoc = await Post.create({
      title,
      summary,
      content,
      cover:newPath,
      author:info.id,
    });
    res.json(postDoc);
  });

});

app.put('/post',uploadMiddleware.single('file'), async (req,res) => {
  let newPath = null;
  if (req.file) {
    const {originalname,path} = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    newPath = path+'.'+ext;
    fs.renameSync(path, newPath);
  }


  const {id,title,summary,content} = req.body;
  const postDoc = await Post.findById(id);
  const isAuthor = 1;
  if (!isAuthor) {
    return res.status(400).json('you are not the author');
  }
  await postDoc.updateOne({
    title,
    summary,
    content,
    cover: newPath ? newPath : postDoc.cover,
  });

  res.json(postDoc);
});


app.get('/post', async (req,res) => {
  res.json(
    await Post.find()
      .populate('author', ['username'])
      .sort({createdAt: -1})
      .limit(20)
  );
});

app.get('/post/:id', async (req, res) => {
  const {id} = req.params;
  const postDoc = await Post.findById(id).populate('author', ['username']);
  res.json(postDoc);
})


// Add a route to get the comments of a post by its id
app.get('/comments/:postId', async (req, res) => {
  const {postId} = req.params;
  let post = await Post.findById(postId);
  let commentIds = post.comments;
  let result = [];
  for (let i = 0; i < commentIds.length; i++) {
    let comment = await Comment.findById(commentIds[i]);
    result.push(comment);
  }
  res.json(result);
});
// Add a route to create a new comment for a post by its id
app.post('/comments/:postId', async (req, res) => {
  const {postId} = req.params;
  const {text, user, date} = req.body;
  const newComment = await Comment.create({text, user, date, post: postId});
  // Update the post with the new comment id
  await Post.findByIdAndUpdate(postId, {$push: {comments: newComment._id}});
  res.json(newComment);
});

// Add a route to delete a comment by its id and the post id
app.delete('/comments/:postId/:commentId', async (req, res) => {
  const {postId, commentId} = req.params;
  // Delete the comment from the database
  await Comment.findByIdAndDelete(commentId);
  // Remove the comment id from the post
  await Post.findByIdAndUpdate(postId, {$pull: {comments: commentId}});
  res.json('comment deleted');
});

app.listen(4000, console.log('server started'));
