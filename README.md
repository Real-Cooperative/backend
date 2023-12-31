# RCIAD Backend <!-- omit in toc -->

The backend for Real Cooperative in the African Diaspora. This is a NodeJS server built to handle incoming requests to communicate with a SurrealDB database.

## Table of Contents <!-- omit in toc -->

-   [Goals](#goals)
-   [Requirements](#requirements)
-   [Installation](#installation)
    -   [Install SurrealDB](#install-surrealdb)
        -   [On MacOS/Linux](#on-macoslinux)
        -   [On Windows](#on-windows)
    -   [Server variables](#server-variables)
    -   [Start the development server](#start-the-development-server)
-   [Usage](#usage)
    -   [Interacting with the API](#interacting-with-the-api)
        -   [User Authentication](#user-authentication)
            -   [Sign up](#sign-up)
            -   [Login](#login)
            -   [Get logged in user details](#get-logged-in-user-details)
        -   [Create a new record](#create-a-new-record)
        -   [Get a record](#get-a-record)
        -   [Get multiple records of the same type](#get-multiple-records-of-the-same-type)
        -   [Delete a record](#delete-a-record)
        -   [Interacting with files](#interacting-with-files)
-   [Contributing](#contributing)
    -   [Building out the API](#building-out-the-api)
-   [Roadmap](#roadmap)

## Goals

-   Flexibility
-   Scalability
-   Reliability
-   Efficiency
-   Security

## Requirements

-   npm
-   SurrealDB

## Installation

### Install SurrealDB

#### On MacOS/Linux

```bash
curl --proto '=https' --tlsv1.2 -sSf https://install.surrealdb.com | sh
```

#### On Windows

```bash
iwr https://windows.surrealdb.com -useb | iex
```

Start SurrealDB in memory and define the user scope and table

```bash
surreal start --log debug --user root --pass root memory &
# runs an import of the user schema and scope if you aren't running a terminal in the cloned repo change the path of user.surql
surreal import --conn http://localhost:8000 --user root --pass root --ns test --db test user.surql
```

### Server variables

| Variable   | Description                 | Default                   |
| ---------- | --------------------------- | ------------------------- |
| SURREAL_DB | SurrealDB connection string | http://localhost:8000/rpc |
| SERVER_URL | Server URL (used for files) | http://localhost:4000     |

Either create a .env file and set the variables or run this command in the terminal

```bash
cat << EOF > .env
SURREAL_DB="http://localhost:8000/rpc"
SERVER_URL="http://localhost:4000"
EOF
```

### Start the development server

```bash
npm install
npm run dev
```

## Usage

### Interacting with the API

You can find usage examples of every route in [test.rest](./test.rest).

#### User Authentication

_(in progress)_

##### Sign up

To sign up send a POST request to `/signup`. The body of the request should be a JSON object with a `username` and `password` property. You can add additional properties as well, but they'll need to be defined in [user.surql](./user.surql) or through a SurrealQL request directily to the database. The `/signup` endpoint will return a JWT token that can be used to authenticate the user.

```javascript
// JavaScript usage

const body = {
    username: "notSpiderman",
    password: "muhGuire",
    email: "tobie@spiderman.com",
    settings: {
        marketing: true,
    },
};

const url = "http://localhost:4000/api/v1/signup";

let response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
});

let data = await response.json();

console.log(data);
```

Response:

```json
{
    "status": "OK",
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpYXQiOjE2ODkwNDA4NzMsIm5iZiI6MTY4OTA0MDg3MywiZXhwIjoxNjkwMjUwNDczLCJpc3MiOiJTdXJyZWFsREIiLCJOUyI6InRlc3QiLCJEQiI6InRlc3QiLCJTQyI6ImFsbHVzZXJzIiwiSUQiOiJ1c2VyOmxsZWozdDhpOXAycGIxazdubWNuIn0.vL_bl90Np5CDGvcTVVpH54rCsmyCIWOBWm-coIS7aT16_tuKV0xXyTBbPOzE3G9k5skikWRvteO_6z04sjhiCA",
    "message": "Registered"
}
```

##### Login

To login send a POST request to `/login`. The body of the request should be a JSON object with a `username` and `password` property. The `/login` endpoint will return a JWT token that can be used to authenticate the user.

```javascript
// JavaScript usage

const body = {
    username: "notSpiderman",
    password: "muhGuire",
};

const url = "http://localhost:4000/api/v1/login";

let response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
});

let data = await response.json();

console.log(data);
```

Response:

```json
{
    "status": "OK",
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpYXQiOjE2ODkwNDA5NzQsIm5iZiI6MTY4OTA0MDk3NCwiZXhwIjoxNjkwMjUwNTc0LCJpc3MiOiJTdXJyZWFsREIiLCJOUyI6InRlc3QiLCJEQiI6InRlc3QiLCJTQyI6ImFsbHVzZXJzIiwiSUQiOiJ1c2VyOnVwdWoweWlmeXoxMWlyeHZrd3djIn0.hnqwkgqTJ5X16hc89JWYex0epEecsROtvGsjGmg5FCD6nocgJP6PXgRRokRDwdi5OVQxWiQfmHxCZxieI4P0Bw",
    "message": "Signed in"
}
```

##### Get logged in user details

To get user details send a GET request to `/me`. The request should include a `Authentication` header with a JWT token. The `/me` endpoint will return the user details.

```javascript
// JavaScript usage

const headers = {
    Authentication:
        "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpYXQiOjE2ODkwNDA5NzQsIm5iZiI6MTY4OTA0MDk3NCwiZXhwIjoxNjkwMjUwNTc0LCJpc3MiOiJTdXJyZWFsREIiLCJOUyI6InRlc3QiLCJEQiI6InRlc3QiLCJTQyI6ImFsbHVzZXJzIiwiSUQiOiJ1c2VyOnVwdWoweWlmeXoxMWlyeHZrd3djIn0.hnqwkgqTJ5X16hc89JWYex0epEecsROtvGsjGmg5FCD6nocgJP6PXgRRokRDwdi5OVQxWiQfmHxCZxieI4P0Bw",
};

const url = "http://localhost:4000/api/v1/me";

let response = await fetch(url, {
    method: "GET",
    headers: headers,
});

let data = await response.json();

console.log(data);
```

Response:

```json
{
    "status": "OK",
    "details": {
        "created": "2023-07-10T18:52:02.533Z",
        "email": "tobie@joonipea.com",
        "id": "user:upuj0yifyz11irxvkwwc",
        "settings": { "marketing": true },
        "user": "notSpiderman"
    },
    "message": "Success"
}
```

#### Create a new record

To create a new record send a POST request to `/post`. The `Authentication` header should contain a valid JWT token. The body of the request should be a JSON object with a `name` and `type` property. The `name` property is the name of the record and the `type` property is the type of record. The `type` property is used to determine which table the record is stored in. To use this record in the frontend use `type:name` as the `id` of the record.

```javascript
// JavaScript usage
let token = local.storage.getItem("token"); //JWT token from login or signup

const headers = {
    Authentication: "Bearer " + token,
};

const body = {
    name: "Black Eyed Peas", //required
    type: "recipe", //required
    description: "A delicious recipe for black eyed peas",
};

const url = "http://localhost:4000/api/v1/post";

let response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
});
let data = await response.json();
console.log(data);
```

Response:

```json
{
    "message": "Success",
    "id": "recipe:Black_Eyed_Peas"
}
```

If a record already exists with the same name and type a new record will be created with a date appended to the end of the id.

```json
{
    "message": "Success",
    "id": "recipe:Black_Eyed_Peas_1689039003963"
}
```

#### Get a record

To get a record send a GET request to `/get`. The head of the request should have a `X-RCIAD-Requested-ID` header with optional `x-rciad-limit`, `x-rciad-page`, and `x-rciad-subscribed` headers. The `X-RCIAD-Requested-ID` header is the id of the record. To use the data contianed in the record use `data.page[0]`. For the total number of records in the request use `data.count`.

```javascript
// header syntax
// X-RCIAD-Requested-ID: string
// x-rciad-limit: number defaults to 10
// x-rciad-page: number defaults to 1
// x-rciad-subscribed: comma seperated list of ids
```

```javascript
// JavaScript usage
const headers = {
    X-RCIAD-Requested-ID: "recipe:Black_Eyed_Peas",
    x-rciad-limit: 10,
    x-rciad-page: 1,
    x-rciad-subscribed: "user:upuj0yifyz11irxvkwwc,user:8ka0jyifyz11irxvkwwe",
};

const url = "http://localhost:4000/api/v1/get";

let response = await fetch(url, {
    method: "GET",
    headers: headers,
});

let data = await response.json();
console.log(data);
```

Response:

```json
{
    "message": "Success",
    "page": [
        {
            "id": "recipe:Black_Eyed_Peas",
            "name": "Black Eyed Peas",
            "type": "recipe",
            "description": "A delicious recipe for black eyed peas",
            "created_at": "2023-07-10T18:52:02.533Z",
            "created_by": "user:upuj0yifyz11irxvkwwc",
            "author": "notSpiderman"
        }
    ],
    "count": 1
}
```

#### Get multiple records of the same type

To get multiple records of the same type send a GET request to `/get`. The head of the request should have a `X-RCIAD-Requested-ID` header with optional `x-rciad-limit`, `x-rciad-page`, and `x-rciad-subscribed` headers. The `X-RCIAD-Requested-ID` header is the id of the record. To use these records in the frontend use `data.page`.

```javascript
// JavaScript usage

const headers = {
    X-RCIAD-Requested-ID: "recipe",
    x-rciad-limit: 10, //defaults to 10 optional
    x-rciad-page: 1, //defaults to 1 optional
    x-rciad-subscribed: "user:upuj0yifyz11irxvkwwc,user:8ka0jyifyz11irxvkwwe", //filter by creator optional
};


const url = "http://localhost:4000/api/v1/get";

let response = await fetch(url, {
    method: "POST",
    headers: headers,
});

let data = await response.json();
console.log(data);
```

Response:

```json
{
    "message": "Success",
    "page": [
        {
            "id": "recipe:Black_Eyed_Peas",
            "name": "Black Eyed Peas",
            "type": "recipe",
            "description": "A delicious recipe for black eyed peas",
            "created_at": "2023-07-10T18:52:02.533Z",
            "created_by": "user:upuj0yifyz11irxvkwwc",
            "author": "notSpiderman"
        },
        {
            "id": "recipe:Black_Eyed_Peas_1689039003963",
            "name": "Black Eyed Peas",
            "type": "recipe",
            "description": "A delicious recipe for black eyed peas",
            "created_at": "2023-07-10T18:55:03.821Z",
            "created_by": "user:upuj0yifyz11irxvkwwc",
            "author": "notSpiderman"
        }
    ],
    "count": 2
}
```

#### Delete a record

To delete a record send a DELETE request to `/delete`. The head should have an `Authentication` header with a valid JWT token. The body of the request should have an `id` property. The `id` property is the id of the record.

```javascript
// JavaScript usage
const token = localStorage.getItem("token"); // get token from local storage

const headers = {
    Authentication: "Bearer " + token,
};

const body = {
    id: "recipe:Black_Eyed_Peas",
};

const url = "http://localhost:4000/api/v1/delete";

let response = await fetch(url, {
    method: "DELETE",
    headers: headers,
    body: JSON.stringify(body),
});
```

Response:

```json
{
    "status": "OK",
    "message": "recipe:Black_Eyed_Peas was deleted"
}
```

#### Interacting with files

To upload a file send a POST request to `/upload`. The body of the request should be a form data object. To use this file in the frontend use the response as a URL.

NOTE: This is not best practice and should only be used for development purposes. In production you should use a CDN.

```javascript
// JavaScript usage
async function uploadFiles(form) {
    let attachment = {};
    let formData = new FormData();
    formData.append("attachment", form);

    await fetch(`http://localhost:4000/api/v1/upload`, {
        cache: "no-store",
        method: "POST",
        body: formData,
    })
        .then((res) => res.text())
        .then((data) => (attachment = { name: form.name, url: data }));

    return attachment;
}

console.log(await uploadFiles(file));
```

Response:

```json
{
    "name": "Black Eyed Peas Image",
    "url": "http://localhost:4000/api/v1/files/Black_Eyed_Peas.jpg"
}
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

### Building out the API

_(in progress)_

## Roadmap

-   [ ] Basic CRUD operations
-   [ ] Logout features
-   [ ] Update user details
-   [ ] Bolster security
-   [ ] Add more authentication methods
-   [ ] Delete Records
-   [ ] Move usage to a wiki or hosted documentation
