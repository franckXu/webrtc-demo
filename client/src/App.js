import React from 'react';
import './App.css';
import Container from './Container';

const Connection = React.createContext({
  connection: null,
  updateConnection: null
});

const Channel = React.createContext({
  channel: null,
  updateChannel: null
});
export const ConnectionConsumer = Connection.Consumer;
export const ChannelConsumer = Channel.Consumer;

function App() {
  return (
    <Connection.Provider value={{
      connection: null,
      updateConnection: null
    }}>
      <Channel.Provider value={{
        channel: null,
        updateChannel: null
      }}>
        <Container />
      </Channel.Provider>
    </Connection.Provider>
  );
}

export default App;
