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
import MessageBox from './MessageBox';
import { format } from "date-fns";
import Video from './Video';

const configuration = {
    iceServers: [{
        url:
            // "stun:stun.xten.com"
            // "stun:stun.1.google.com:19302"
            "stun:stun.services.mozilla.com"
    }]
};

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
    const messagesRef = useRef([]);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState({});
    const connectedRef = useRef("");
    const [connectedTo, setConnectedTo] = useState("");
    const [connecting, setConnecting] = useState(false);
    const videoEleRef = React.useRef(null);
    const remoteVideoEleRef = React.useRef(null);

    const closeAlert = () => setAlert(null);
    const updateUsersList = ({ user }) => {
        setUsers(prev => ([...prev, user]))
    };
    const removeUser = ({ user }) => {
        setUsers(prev => prev.filter(u => u.userName !== user.userName))
    }

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

            let localConnection = new RTCPeerConnection(configuration);
            localConnection.onicecandidate = ({ candidate }) => {
                console.log('onicecandidate', candidate, connectedRef.current);
                let connectedTo = connectedRef.current;
                if (candidate && !!connectedTo) {
                    send({
                        name: connectedTo,
                        type: "candidate",
                        candidate
                    })
                };
            }
            localConnection.ondatachannel = (event) => {
                console.log('ondatachannel');
                let receiveChannel = event.channel;
                receiveChannel.onopen = () => {
                    console.log("Data channel is open and ready to be used.")
                };
                receiveChannel.onmessage = handleDataChannelMessageReceived;
                updateChannel(receiveChannel);
            };

            addMediaStreamToConnection(localConnection);

            localConnection.ontrack = (event) => {
                console.log('ontrack.', event);
                if (!remoteVideoEleRef.current) {
                    alert('remoteVideoEle is null');
                    return;
                }

                remoteVideoEleRef.current.srcObject = event.streams[0];
            }

            updateConnection(localConnection);
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

        connection.createOffer()
            .then(offer => {
                console.log('createOffer', offer);
                return connection.setLocalDescription(offer);
            })
            .then(() =>
                send({
                    type: "offer",
                    offer: connection.localDescription,
                    name
                }))
            .catch(e => {
                setAlert(
                    <SweetAlert
                        warning
                        confirmBtnBsStyle="danger"
                        title="failed"
                        onConfirm={closeAlert}
                        onCancel={closeAlert}
                    >
                        An error has ocurred.
                        </SweetAlert>
                )
            })
    };

    const onOffer = ({ name, offer }) => {
        setConnectedTo(name);
        connectedRef.current = name;
        connection
            .setRemoteDescription(new RTCSessionDescription(offer))
            .then(() => connection.createAnswer())
            .then((answer) => connection.setLocalDescription(answer))
            .then(() => send({
                type: "answer",
                answer: connection.localDescription,
                name: name
            }))
            .catch(e => {
                console.log({ e });
                setAlert(
                    <SweetAlert
                        warning
                        confirmBtnBsStyle="danger"
                        title="Failed"
                        onConfirm={closeAlert}
                        onCancel={closeAlert}
                    >  An error has ocurred. </SweetAlert>
                )
            })
    };

    const onAnswer = ({ answer }) => {
        console.log('onAnswer', answer);
        connection.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const onCandidate = ({ candidate }) => {
        const ice = new RTCIceCandidate(candidate);
        console.log('onCandidate', candidate, ice, connection.remoteDescription);
        connection.addIceCandidate(ice)
            // connection.addIceCandidate(candidate)
            .catch(e => {
                console.log({ e });
            })

    }

    const sendMsg = () => {
        const time = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        let text = { time, message, name };
        let messages = messagesRef.current;
        let connectedTo = connectedRef.current;
        let userMessages = messages[connectedTo];
        if (userMessages) {
            userMessages = [...userMessages, text];
            let newMessages = Object.assign({}, messages, {
                [connectedRef]: userMessages
            });
            messagesRef.current = newMessages;
            setMessages(newMessages);
        } else {
            userMessages = Object.assign({}, messages, {
                [connectedRef]: [text]
            });
            messagesRef.current = userMessages;
            setMessages(userMessages);
        }
        channel.send(JSON.stringify(text));
        setMessage("");
    }

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

    const handleDataChannelMessageReceived = ({ data }) => {
        const message = JSON.parse(data);
        const { name: user } = message;
        let messages = messagesRef.current;
        let userMessages = messages[user];
        if (userMessages) {
            userMessages = [...userMessages, message];
            let newMessages = Object.assign({}, messages, {
                [user]: userMessages
            });
            messagesRef.current = newMessages;
            setMessages(newMessages);
        } else {
            let newMessages = Object.assign({}, messages, {
                [user]: [message]
            });
            messagesRef.current = newMessages;
            setMessages(newMessages);
        }
    };

    const addMediaStreamToConnection = async (connection) => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                // audio: true
            });
            videoEleRef.current.srcObject = mediaStream;

            mediaStream.getTracks().forEach(track => {
                console.log('getTrack', track);
                connection.addTrack(track, mediaStream);
                // connection.addTransceiver(track, { streams: [mediaStream] });
            })
        } catch (err) {
            console.error(err)
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
                    updateUsersList(data);
                    break;
                }
                case "error": {
                    console.log('error', data);
                    break;
                }
                case "offer": {
                    console.log('offer', data);
                    onOffer(data);
                    break;
                }
                case "answer": {
                    console.log('answer', data);
                    onAnswer(data);
                    break;
                }
                case "candidate": {
                    console.log('candidate', data);
                    onCandidate(data);
                    break;
                }
                case "leave": {
                    console.log('leave', data);
                    removeUser(data);
                    break;
                }
                default:
                    break;
            }
        }

    }, [socketMessage]);

    return (
        <div className="App">
            {alert}
            <div>
                <h4>local</h4>
                <video autoPlay ref={videoEleRef}>not suppert video</video>
            </div>
            <div>
                <h4>remote</h4>
                <video autoPlay ref={remoteVideoEleRef}>not suppert video</video>
            </div>
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
                            <MessageBox
                                {...{ messages, connectedTo, message, setMessage, sendMsg, name }} />
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