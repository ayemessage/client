import React from 'react';
import chat from '../../models/chat';
import {Col, Container, ListGroup, Row} from "react-bootstrap";
import Messages from "./messages";


export default class Chats extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            activeChat: false,
            chats: []
        }

        this.updateChats();
    }

    async updateChats() {
        let chats = await chat.query().orderBy('last_message.date').desc().toArray()

        this.setState({
            chats
        })
        if (!this.state.activeChat) {
            this.setState({
                activeChat: this.state.chats[0]
            })
        }
    }

    selectChat(activeChat) {
        this.setState({activeChat})
    }

    render() {
        return (
            <Container fluid className={"chat-ui"}>
                <Row className="justify-content-md-center">
                    <Col sm={4} md={3} lg="2" className={"chat-sidebar"}>
                        <ListGroup variant="flush">
                            {this.state.chats.map(chat => (
                                <ListGroup.Item className={"chat-sidebar-item"} onClick={() => this.selectChat(chat)}>
                                    <b>{chat.getChatName()}</b>
                                    <p className={"chat-last-message"}>{chat.last_message ? chat.last_message.text : ""}</p>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </Col>
                    <Col sm="8" md={"9"} lg={"10"} className={"chat-messages-pane"}>
                        {this.state.activeChat ? (
                            <Messages chatId={this.state.activeChat.id}/>
                        ) : (
                            <div>No Active Chat Selected</div>
                        )}
                    </Col>

                </Row>
            </Container>
        )
    }
}