import React from 'react';
import logo from './logo.svg';
import './App.css';

/*

Ok, so here is the skinny on how to interface this new data, the first step is to brush up on Dexie.js

Next, you can access ANY data that the app has with dataflow.db.{tablename}

From there, you will be able to wait on dataflow.on('{tablename}', data=>{}) to watch for data changes.

You can also send messages with dataflow.sendMessage({chat_identifier, text, attachments})

After that, this is just a standard react chat app from programming 101 :)

Oh, you can also view the data we have access to in developer tools -> Application -> IndexedDb


 */


function App() {
  return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo"/>
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
