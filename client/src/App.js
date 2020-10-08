import React, { useState } from 'react';
import './App.css';
import Container from './Container';

const Connection = React.createContext({
  connection: null,
  updateConnection: () => { }
});

const Channel = React.createContext({
  channel: null,
  updateChannel: () => { }
});
export const ConnectionConsumer = Connection.Consumer;
export const ChannelConsumer = Channel.Consumer;


function App() {

  const [channel, setChannel] = useState(null);
  const [connection, setConnection] = useState(null);

  return (
    <Connection.Provider value={{
      connection,
      updateConnection(connection) {
        console.log('updateConnection', connection);
        setConnection(connection)
      }
    }}>
      <Channel.Provider value={{
        channel,
        updateChannel(channel) {
          setChannel(channel)
        }
      }}>
        <Container />
      </Channel.Provider>
    </Connection.Provider>
  );
}

export default App;
