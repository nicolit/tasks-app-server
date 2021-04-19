const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });

const admin = require("firebase-admin");
admin.initializeApp();
const database = admin.database().ref("/boards/");
const databaseRD = admin.database().ref("/boards/R&D");
const databaseSales = admin.database().ref("/boards/Sales");

const getBoard = (board) => {
  if (board.toUpperCase() === "SALES") {
    return databaseSales;
  } else {
    return databaseRD;
  }
};

const getTasksFromDatabase = (boardRef, res) => {
  return boardRef.child("tasks").on(
    "value",
    (snapshot) => {
      const tasks = Object.values(snapshot.val());

      res.status(200).json({ tasks, num_tasks: tasks.length });
    },
    (error) => {
      res.status(500).json({
        message: `Something went wrong. ${error}`,
      });
      //functions.logger.info("logger- Failed to send client respone with db items.");
    }
  );
};

const countTasks = (board) => {
  functions.database
    .ref(`/boards/${board}/tasks`)
    .onWrite((change, context) => {
      const collectionRef = change.after.ref.parent;
      const countRef = collectionRef.parent.child("num_tasks");

      // Return the promise from countRef.transaction() so our function
      // waits for this async event to complete before it exits.
      return countRef.transaction((current) => {
        if (change.after.exists() && !change.before.exists()) {
          return (current || 0) + 1;
        } else if (!change.after.exists() && change.before.exists()) {
          return (current || 0) - 1;
        }
      });
      //functions.logger.log('Counter updated.');
    });
};

// https://us-central1-kanban-board-875ad.cloudfunctions.net/addTask
exports.addTask = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (req.method !== "POST") {
      return res.status(500).json({
        message: "Not allowed",
      });
    }
    const item = JSON.parse(req.body.item);
    const board = req.body.board;
    const boardRef = getBoard(board);
    const newTaskRef = boardRef.child("tasks").push().then(() => {
      console.log("Document successfully added!");
    });
    newTaskRef.set({ ...item, id: newTaskRef.key });

    /*
      const numTasks = countTasks(board);
      boardRef.child("num_tasks").set(numTasks, function(error) {
        if (error) {
          console.log("tasks could not be counted." + error);
        } else {
          console.log("tasks were counted successfully.");
        }
      });
      */

    getTasksFromDatabase(boardRef, res);
  });
});

// https://us-central1-kanban-board-875ad.cloudfunctions.net/getTasks?board=${board}
exports.getTasks = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (req.method !== "GET") {
      return res.status(500).json({
        message: "Not allowed",
      });
    }

    const board = req.query.board;
    const boardRef = getBoard(board);
    getTasksFromDatabase(boardRef, res);
  });
});

// https://us-central1-kanban-board-875ad.cloudfunctions.net/deleteTask?id=${id}&board=${title}
exports.deleteTask = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (req.method !== "DELETE") {
      return res.status(500).json({
        message: "Not allowed",
      });
    }
    const id = req.query.id;
    const board = req.query.board;
    admin.database().ref(`/boards/${board}/tasks/${id}`).remove().then(() => {
      console.log("Document successfully deleted!");
    });
    const boardRef = getBoard(board);
    getTasksFromDatabase(boardRef, res);
  });
});

// https://us-central1-kanban-board-875ad.cloudfunctions.net/updateTask
exports.updateTask = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (req.method !== "POST") {
      return res.status(500).json({
        message: "Not allowed",
      });
    }
    const item = JSON.parse(req.body.item);
    const board = req.body.board;
    const boardRef = getBoard(board);
    boardRef.child('tasks').child(item.id).update(item).then(() => {
      console.log("Document successfully updated!");
    });
    getTasksFromDatabase(boardRef, res);
  });
});
