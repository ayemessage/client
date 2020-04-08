# ayeMessage Client

Before I get too far along in development, I am just going to write out what this is, what it does, how it works, and how I will make it worth my time.

If you really want to make this happen, donations are always appreciated!

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=NSDQJYW4RBZU6&source=url)

You can also **subscribe** here to get emailed updates when things are ready: https://mailchi.mp/b2d68402704b/ayemessage

## Status



 - [X] Prove worker concept (ie the core concepts of application)
 - [x] Decide on frameworks, etc
 - [X] Boilerplate, get frameworks installed and working
 - [X] Complete server data mover
 - [X] Complete client data-flow
 - [X] Rebuild worker to send and receive for this app
 - [ ] User authentication
 - [ ] Encryption of messages
 - [ ] P2P transmission
 - [X] Basic Chat UI
 - [ ] Deal with attachments
 - [X] Get Electron app configured and running
 - [ ] Launch publically available comm server for beta

## How The Data is Accessed

With regard to this application, there are two components, not widely available, required to make this work:

1. How to access old messages in Messages
2. How to send a message via Messages, without a prompt or confirmation.

Connveniently, both have already been answered with a library called [osa-imessage](https://github.com/wtfaremyinitials/osa-imessage), a javascript library that can do both od the required operations.

To do the first item listed, we can simply access `~/Library/Messages/chat.db` and there is a simple, standard SQLite db that contains all of your messages.  One win down.

The next item is sending.  Fortunately, Apple has made an API for us to do this with, using "Apple's Open Scripting Architecture". Using this, we can simply send messages of any type.

Once these concepts have been identified, the rest is standard software.

## The Architecture

So the other component of this, is the ability to send, receive, and view messages anywhere from any device securely.  This requires three components.

Right off the bat, due to the nature of the elements involced (widespread compatibility, popular languages, and one solid for UI, and that I know :) this will be done in JavaScript.

### 1. Realtime communication

In today's world of software, the possibilities for this are endless.  For simplicity, I am going to use a basic, Websocket messaging queue compatible library.

This allows us to accomplish:

### 2. Internet accessable communication

Here we want to be able to communicate both locally and from anywhere, preferring local when possible.

For this, we have two powerful libaries, `socket.io` and `cote` for WAN communication, and local, self discovery when possible.  I will likely open source the server, but provide an "easy" paid version that anyone can access without technical/server skills.

Now we need a place to store everything, so we look to:

### 3. Secure storage and transmission

This will be the trickiest for most people, as your messages are generally not something you want aired out, so truly secure point-to-point messaging will be critical. So let's talk through what this looks like. Bottom line, I don't want to see your messages, nor store any facet of them.


## Rough Process

Let's talk about how this might function.

There are three actors on this:

1. Worker: This is the program running on the Mac with Messages running
2. Client: This is any device that you want to message from
3. Server: The part that allows these to talk to each other if not in proximity.

I don't actually want to know who you are, or anything about you. I also don't want to have to maintain stateful storage on you, so this is how I would do this:

1. On app first run, Client/Worker will be asked for a `username`, `password`, and `encryptionKey`, this will generate a very long string using something like `aes512(sha512(username + encryptionKey), username+password)` we will call this your `userToken`. Note, Server sees NONE of those in plain text, and as you will see later, has no access to anything relevant that is transmitted.
2. Now that this is generated, Client/Worker will use that token to connect to a remote namespace (in socket.io and self-discovering local nodes with cote), which will be something like `/user/${userToken}`, this all over SSL to add another layer of security.
3. Finally, upon initial connection, Client will emit to everyone in said namespace a request for all messages since last run (or since beginning of time if this is your first run) - but these messages will NOT come from the server. Instead they will come from one of two places:
  1. If your Worker is online, it will respond with the requested messages, encrypted using `encryptionKey` at the Worker
  2. If Worker is offline or not responding, then other Clients that possess the requested data are in fact online, then they themselves can transmit (encrypted) the requested data.
4. Any messages received will be stored using local storage to the device you are on, so you can access your data even if the Worker is offline, but without the need to have the Server know what your data is, who you are, or really anything other than passing traffic.


## Building The Thing

Ok, so more specific to the application, here is my plan:

1. I will create a thin socket.io server that will ferry the requested messages back and forth.
2. Next, will create an Electron app with two effective components:
  1. A React UI "Client", that will interface said server and self-discover to nearby authenticated devices, store using  dexie.js and from there, it's just another chat app
  2. The Worker will be bundleled into this app that will interface the messages, and will just be a very thin socket client.
  
  
Now I just need to build it.  Feel free to comment as needed with your input on my strategy!



# React

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `npm run build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
