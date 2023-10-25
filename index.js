const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



// create model user
let mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const Schema = mongoose.Schema;

const exerciseSchema = new Schema({
  date: { type: Date, required: true },
  duration: { type: Number, required: true },
  desc: { type: String, required: true },
});


const userSchema = new Schema({
  username: { type: String, required: true },
  exercises: [exerciseSchema],
  count: { type: Number, required: false },
  from: { type: Date, required: false },
  to: { type: Date, required: false },
  log: [exerciseSchema],
});

let User = mongoose.model('User', userSchema);

// create function to create new user
const createUser = async (username) => {
  let newUser = new User({ username: username });
  try {
    let data = await newUser.save();
    return data;
  } catch (err) {
    throw err;
  }
};

// create function to get all user
const getAllUser = async () => {
  try {
    let data = await User.find();
    return data;
  } catch (err) {
    throw err;
  }
};


// create function to get user by id
const getUserById = async (id) => {
  try {
    let data = await User.findById(id);
    return data;

  } catch (err) {
    throw err;
  }
};

const insertExercise = async (userId, exercise) => {
  try {
    let data = await User.findByIdAndUpdate(userId, { $push: { exercises: exercise } }, { new: true });
    return data;
  } catch (err) {
    throw err;
  }
};

const addExercise = async (_id, exerciseData, requestBody) => { // Added requestBody parameter
  let userId = requestBody.userId;

  if (requestBody.date === '') {
    requestBody.date = new Date();
  }

  let exercise = {
    date: requestBody.date,
    duration: requestBody.duration,
    desc: requestBody.description,
  };

  try {
    let data = await insertExercise(_id, exercise);
    result = {
      _id: data._id,
      username: data.username,
      date: new Date(exercise.date).toDateString(),
      duration: parseInt(exercise.duration),
      description: exercise.desc,
    };
    return result;
  } catch (err) {
    throw err;
  }
};

app.post('/api/users', async (req, res) => {
  const username = req.body.username;

  // create new user
  try {
    let result = await createUser(username);
    res.json({ username: result.username, _id: result._id });
  } catch (err) {
    res.json({ error: err });
  }
});

app.get('/api/users', async (req, res) => {
  // get all user
  try {
    let result = await getAllUser();

    // filter only id and username show
    let filteredResult = result.map((item) => {
      return { _id: item._id, username: item.username };
    });

    res.json(filteredResult);

  } catch (err) {
    res.json({ error: err });
  }
});

app.post('/api/users/:_id/exercises', async (req, res) => {

  const _id = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  const dateRaw = req.body.date;

  let user;
  try {
    user = await getUserById(_id);
    if (!user) {
      return res.json({
        error: 'User not found'
      });
    }
  } catch (err) {
    return res.json({ error: err });
  }

  date = new Date(dateRaw);

  if (isNaN(date.getTime())) {
    date = new Date();
  }

  date = date.toDateString();

  // create new exercise
  try {

    let result = await addExercise(_id, { // Corrected function call here
      date: date,
      duration: duration,
      description: description
    }, req.body); // Passed req.body as an argument

    res.json(result);

  } catch (err) {
    res.json({ error: err });
  }
});
// /api/users/:_id/logs?[from][&to][&limit]

app.get('/api/users/:_id/logs', async function(req, res) {
  const _id = req.params._id;
  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit;


  let user;
  try {
    user = await getUserById(_id);
    if (!user) {
      return res.json({
        error: 'User not found'
      });
    }
  } catch (err) {
    return res.json({ error: err });
  }


  // change user.exercise to user.log

  user.count = user.exercises.length;
  user.log = user.exercises;


  // filter user if from is set in link
  if (req.query.from) {
    user.log = user.log.filter((item) => {
      return item.date >= new Date(from);
    });
    user.from = new Date(req.query.from).toDateString();
  }

  // get query param
  if (req.query.to) {
    user.log = user.log.filter((item) => {
      return item.date <= new Date(to);
    });
    user.to = new Date(req.query.to).toDateString();
  }


  if (req.query.limit) {
    user.log = user.log.slice(0, parseInt(limit));
  }

  // convert date in user.log array to todatestring()
  user.log = user.log.map((item) => {
    item.date = new Date(item.date).toDateString();
    return item;
  });

  // return user
  res.json(user);


});

app.get('/api/users', function(req, res) {
  res.json(users);
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
