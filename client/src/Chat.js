import React, { Fragment, useState, useEffect, useRef } from 'react';
import {
    Grid,
    Header,
    Icon,
    Input,
    Loader,
    Segment,
    Button,
} from 'semantic-ui-react';
import SweetAlert from 'react-bootstrap-sweetalert';
import UsersList from './UsersList';

const Chat = ({ connection,
    updateConnection,
    channel,
    updateChannel }) => {

    const webSocket = useRef(null);
    const [socketOpen, setSocketOpen] = useState(false);
    const [socketMessage, setSocketMessage] = useState([]);
    const [alert, setAlert] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [name, setName] = useState("");
    const [loggingIn, setLoggingIn] = useState(false);

    const [users, setUsers] = useState([]);

    const closeAlert = () => setAlert(null);

    const send = (data) => {
        webSocket.current.send(JSON.stringify(data))
    }

    const handleLogin = () => {
        setLoggingIn(true);
        send({
            type: "login",
            name,
        });
    }

    const onLogin = ({ success, message, users: loggedIn }) => {
        setLoggingIn(false);

        if (success) {
            setAlert(<SweetAlert
                success
                title="Success!"
                onConfirm={closeAlert}
                onCancel={closeAlert}
            >Logged in successfully!</SweetAlert>);
            setIsLoggedIn(true);
            setUsers(loggedIn);
            const configuration = {
                iceServers: [{ url: "stun:stun.1.google.com:19302" }]
            };
            let localConnection = new RTCPeerConnection(configuration);
            localConnection.onicecandidate = ({ candidate }) => {
                let connectedTo = connectedRef.current;
                if (candidate && !!connectedTo) {
                    send({
                        name: connectedTo,
                        type: "candidate",
                        candidate
                    })
                };
                localConnection.ondatachannel = (event) => {
                    let receiveChannel = event.channel;
                    receiveChannel.onopen = () => {
                        console.log("Data channel is open and ready to be used.")
                    };
                    receiveChannel.onmessage = handleDataChannelMessageReceived;
                    updateChannel(receiveChannel);
                };
                updateConnection(localConnection);
            }
        } else {
            setAlert(<SweetAlert
                warning
                confirmBtnBsStyle="danger"
                title="Failed!"
                onConfirm={closeAlert}
                onCancel={closeAlert}
            >{message}</SweetAlert>);
        }
    };

    const handleConnection = (name) => {
        console.log('handleConnection ', name);
        let dataChannel = connection.createDataChannel("messenger");
        dataChannel.onerror = error => {
            setAlert(
                <SweetAlert
                    warning
                    confirmBtnBsStyle="danger"
                    title="Failed"
                    onConfirm={closeAlert}
                    onCancel={closeAlert}
                >
                    An error has ocurred.
                </SweetAlert>
            );
        };
        dataChannel.onmessage = handleDataChannelMessageReceived;
        updateChannel(dataChannel);
    }

    const connectedRef = useRef("");
    const [connectedTo, setConnectedTo] = useState("");
    const [connecting, setConnecting] = useState(false);
    const toggleConnection = (userName) => {
        // disconnect
        if (connectedRef.current === userName) {
            setConnecting(true);
            setConnectedTo("")
            connectedRef.current = "";
            setConnecting(false);
            // connect
        } else {
            setConnecting(true);
            setConnectedTo(userName)
            connectedRef.current = userName;
            handleConnection(userName);
            setConnecting(false);
        }
    };

    useEffect(() => {
        webSocket.current = new WebSocket("ws://localhost:9000");
        webSocket.current.onmessage = message => {
            const data = JSON.parse(message.data);
            setSocketMessage(prev => {
                return [...prev, data]
            });
        }

        webSocket.current.onclose = () => {
            webSocket.current.close();
        }

        return () => webSocket.current.close();

    }, []);

    useEffect(() => {
        let data = socketMessage.pop();
        if (data) {
            console.log(data);
            switch (data.type) {
                case "message":
                case "connect": {
                    setSocketOpen(true);
                    break;
                }
                case "login": {
                    onLogin(data);
                    break;
                }
                case "updateUsers": {
                    console.log(data);
                    setUsers(users => ([data.user, ...users]))
                    break;
                }
                case "error": {
                    console.log('error', data);
                    break;
                }
                case "offer": {
                    console.log('offer', data);
                    break;
                }
                case "answer": {
                    console.log('answer', data);
                    break;
                }
                case "candidate": {
                    console.log('candidate', data);
                    break;
                }
                case "leave": {
                    console.log('leave', data);
                    break;
                }
                default:
                    break;
            }
        }

    }, [socketMessage])

    return (
        <div className="App">
            {alert}
            <Header as="h2" icon>
                <Icon name="users" />
                Simple WebRTC Chap App
            </Header>
            {
                (socketOpen && (
                    <Fragment>
                        <Grid centered columns={4}>
                            <Grid.Column>
                                {
                                    (!isLoggedIn && (
                                        <Input
                                            fluid
                                            disabled={loggingIn}
                                            type="text"
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Username..."
                                            action
                                        >
                                            <input />
                                            <Button
                                                color="teal"
                                                disabled={!name || loggingIn}
                                                onClick={handleLogin}
                                            ><Icon name="sign-in" /> Login</Button>
                                        </Input>
                                    )) || (
                                        <Segment raised textAlign="center" color="olive" >
                                            Logged In as: {name}
                                        </Segment>
                                    )
                                }
                            </Grid.Column>
                        </Grid>
                        <Grid>
                            <UsersList
                                users={users}
                                toggleConnection={toggleConnection}
                                connectedTo={connectedTo}
                                connecting={connecting}
                            >

                            </UsersList>
                        </Grid>
                    </Fragment>
                )) || (
                    <Loader size="massive" active inline="centered">
                        Loading
                    </Loader>
                )
            }
        </div>
    );
}

export default Chat;