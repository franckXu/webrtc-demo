import React from 'react';
import Chat from './Chat';
import { ConnectionConsumer, ChannelConsumer } from "./App";

const Container = () => {
    return (
        <ConnectionConsumer>
            {({ connection, updateConnection }) => {
                return (
                    <ChannelConsumer>
                        {({ channel, updateChannel }) => {
                            return (
                                <Chat
                                    {...{
                                        connection,
                                        updateConnection,
                                        channel,
                                        updateChannel
                                    }}
                                />
                            )
                        }}
                    </ChannelConsumer>
                )
            }}
        </ConnectionConsumer>
    )
}

export default Container;