# tasks-app-server

tasks-app-demo basic server cloud functions with node 12.

Defines several basic cloud functions + database functions to allow client use kanban tasks app.

client: https://github.com/nicolit/tasks-app-demo

## Add task to board
  url: `/addTask`
<br>
  body params: item, board
<br>

## Get board tasks
  url: `/getTasks?board=${board}`
<br>

## Delete task from board
  url: `/deleteTask?id=${id}&board=${title}`
<br>

## Update task in board
  url: `/updateTask`
<br>
  body params: item, board
<br>
* currently client supports updates in description, status, date of task. 
* The API get's item with any change which is merged with task other keys on DB.
<br>
