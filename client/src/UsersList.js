import React from 'react';
import {
    Grid,
    Segment,
    List,
    Button,
    Image, Card
} from 'semantic-ui-react';

const UsersList = ({
    users,
    toggleConnection,
    connectedTo,
    connecting
}) => {
    return (
        <Grid.Column width={5}>
            <Card fluid>
                <Card.Content header="Online Users" />
                <Card.Content textAlign="left">
                    {
                        (users.length && (
                            <List divided verticalAlign="middle" size="large">
                                {
                                    users.map(({ userName }) => {
                                        return (
                                            <List.Item key={userName}>
                                                <List.Content floated="right">
                                                    <Button onClick={() => {
                                                        toggleConnection(userName)
                                                    }}
                                                        disabled={!!connectedTo && connectedTo !== userName}
                                                        loading={connectedTo === userName && connecting}>
                                                        {
                                                            connectedTo === userName ? "Disconnect" : "Connect"
                                                        }
                                                    </Button>
                                                </List.Content>
                                                {/* <Image avatar src={require("./avatar.svg")} /> */}
                                                <List.Content>
                                                    <List.Header>{userName}</List.Header>
                                                </List.Content>
                                            </List.Item>
                                        )
                                    })
                                }
                            </List>
                        )) || (
                            <Segment>There are no users Online</Segment>
                        )
                    }
                </Card.Content>
            </Card>
        </Grid.Column>
    )
}
export default UsersList;