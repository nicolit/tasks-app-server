const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });

const admin = require("firebase-admin");
admin.initializeApp();
const database = admin.database().ref("/boards/");
const databaseRD = admin.database().ref("/boards/R&D");
const databaseSales = admin.database().ref("/boards/Sales");

const getBoard = (board) => {
  if (board) {
    functions.logger.info(`got board: ${board}`);
    if (board.toUpperCase() === "SALES") {
      return databaseSales;
    } else {
      return databaseRD;
    }
  }
  return null;
};

const getTasksFromDatabase = (boardRef, res) => {
  return boardRef.child("tasks").on(
    "value",
    (snapshot) => {
      let exists = snapshot.val() !== null;
      const tasks = exists ? Object.values(snapshot.val()) : [];

      res.set("Access-Control-Allow-Origin", "*");
      res.status(200).json({ tasks, num_tasks: tasks.length });
    },
    (error) => {
      res.status(500).json({
        message: `Something went wrong. ${error}`,
      });
      functions.logger.info(
        "getTasksFromDatabase: Failed to send client response with db items."
      );
    }
  );
};

exports.countTasks = functions.database
  .ref(`/boards/{board}/tasks/{task}`)
  .onWrite((change, context) => {
    const collectionRef = change.after.ref.parent;
    const countRef = collectionRef.parent.child("num_tasks");

    // Return the promise from countRef.transaction() so our function
    // waits for this async event to complete before it exits.
    return countRef.transaction((current) => {
      if (change.after.exists() && !change.before.exists()) {
        return (current || 0) + 1;
      } else {
        // if (!change.after.exists() && change.before.exists()) {
        return (current || 0) - 1;
      }
    });
  });

// https://us-central1-kanban-board-875ad.cloudfunctions.net/addTask
exports.addTask = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (req.method !== "POST") {
      return res.status(500).json({
        message: "Method is not allowed",
      });
    }
    try {
      let { item, board } = req.body; // JSON.parse
      if (typeof item === "string") {
        item = JSON.parse(req.body.item);
      }

      if (board && item && typeof item === 'object') {
        const boardRef = getBoard(board);
        const newTaskRef = boardRef.child("tasks").push();

        newTaskRef.set({ ...item, id: newTaskRef.key }, (e) => {
          if (e) {
            functions.logger.log(`Failed to set task item. ${e.message}`);
            res.status(500).json({
              message: `Error in addTask: Failed to set task item. ${e.message}`,
            });
          } else {
            functions.logger.log("Document successfully added and updated!");
            getTasksFromDatabase(boardRef, res);
          }
        });
      } else {
        functions.logger.log("Error in getTasks: no board in body");
        res.status(500).json({
          message: `Error in addTask: no board in body.`,
        });
      }
    } catch (e) {
      functions.logger.log("addTask failed." + e);
      res.status(500).json({
        message: `Error in addTask: ${e.message}.`,
      });
    }
  });
});

// https://us-central1-kanban-board-875ad.cloudfunctions.net/getTasks?board=${board}
exports.getTasks = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (req.method !== "GET") {
      return res.status(500).json({
        message: "Method is not allowed",
      });
    }

    const board = req.query.board;
    if (board) {
      const boardRef = getBoard(board);
      getTasksFromDatabase(boardRef, res);
    } else {
      functions.logger.log("Error in getTasks: no board in body");
      res.status(500).json({
        message: `Error in getTasks: no board in query.`,
      });
    }
  });
});

// https://us-central1-kanban-board-875ad.cloudfunctions.net/deleteTask?id=${id}&board=${title}
exports.deleteTask = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (req.method !== "DELETE") {
      return res.status(500).json({
        message: "Method is not allowed",
      });
    }
    const id = req.query.id;
    const board = req.query.board;
    if (board && id){
      admin
      .database()
      .ref(`/boards/${board}/tasks/${id}`)
      .remove((e) => {
        if (e) {
          functions.logger.log(`Failed to delete task. ${e.message}`);
          res.status(500).json({
            message: `Error in deleteTask: ${e.message}`,
          });
        } else {
          functions.logger.log("Document successfully deleted!");
          const boardRef = getBoard(board);
          getTasksFromDatabase(boardRef, res);
        }
      });

    } else {
      functions.logger.log("Error in deleteTask: no board in query");
      res.status(500).json({
        message: `Error in deleteTask: no board in query.`,
      });
    }

  });
});

// https://us-central1-kanban-board-875ad.cloudfunctions.net/updateTask
exports.updateTask = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (req.method !== "POST") {
      return res.status(500).json({
        message: "Method is not allowed",
      });
    }

    try {
      let { item, board } = req.body;
      if (typeof item === "string") {
        item = JSON.parse(req.body.item);
      }

      if (board && item && typeof item === 'object') {
        const boardRef = getBoard(board);
        boardRef
          .child("tasks")
          .child(item.id)
          .update(item, (e) => {
            if (e) {
              functions.logger.log(`Failed to updateTask item. ${e.message}`);
              res.status(500).json({
                message: `Error in updateTask: Failed to update task item. ${e.message}`,
              });
            } else {
              functions.logger.log("Document successfully updated!");
              getTasksFromDatabase(boardRef, res);
            }
          });
      } else {
        functions.logger.log("Error in updateTask: no board in body");
        res.status(500).json({
          message: `Error in updateTask: no board in body.`,
        });
      }
    } catch (e) {
      functions.logger.log("updateTask failed." + e.message);
      res.status(500).json({
        message: `Error in updateTask: ${e.message}.`,
      });
    }
  });
});
