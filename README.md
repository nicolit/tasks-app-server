# tasks-app-server

tasks-app-demo basic server cloud functions with node 12.

Defines several basic cloud functions + database functions to allow client use kanban tasks app.

client: https://github.com/nicolit/tasks-app-demo

### Prerequisites

Following dependencies should be installed before getting started.
* npm
```sh
npm install npm@latest -g
```
* add firebase-tools
```sh
npm install -g firebase-tools
```
Follow the instructions on how to initialize your project:
<a href="https://firebase.google.com/docs/functions/get-started">Initialize Your Project</a>

## Add task to board
  url: `/addTask`
<br>
  body params: item, board
<br>

## Get board tasks
  url: `/getTasks?board=${board}`
<br>

## Delete task from board
  url: `/deleteTask?id=${id}&board=${board}`
<br>

## Update task in board
  url: `/updateTask`
<br>
  body params: item, board
<br>
* currently client supports updates in description, status, date of task. 
* The API get's item with any change which is merged with task other keys on DB.
<br>

## License
  See [LICENSE](/LICENSE)
