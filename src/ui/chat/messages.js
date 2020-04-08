import React from 'react';
import message from "../../models/message";
import Compose from "../Compose";
import ToolbarButton from "../TbButton";
import Message from '../Message'
import {IonContent, IonFooter, IonHeader, IonTitle, IonToolbar} from "@ionic/react";
import dataflow from "../../dataflow";


export default class Messages extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            messages: [],
            is_typing: false,
        }
        this.bottomRef = React.createRef();
        this.messageList = React.createRef();
        dataflow.on('messagesUpdated', this.updateMessages.bind(this));
    }

    componentDidMount() {
        this.updateMessages();
    }

    async componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.chat.id == this.props.chat.id) return;
        this.state.messages = [];
        await this.updateMessages();
    }

    async updateMessages() {
        var scrollToBottom = (this.state.messages.length == 0);
        console.log(this.props);
        let messages = await message.query().where({'chat_id': this.props.chat.id}).reverse().limit(100).toArray();

        messages = messages.sort((a, b) => a._cocoa_date < b._cocoa_date ? -1 : 1)

        this.setState({messages});
        this.scrollToBottom({smooth: scrollToBottom});
    }

    scrollToBottom = ({smooth}) => {
        this.bottomRef && this.bottomRef.current && this.bottomRef.current.scrollIntoView({behavior: smooth ? 'smooth' : 'auto'})
    }

    render() {
        return (
            <React.Fragment>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>{this.props.chat ? this.props.chat.getChatName() : null}</IonTitle>
                    </IonToolbar>
                </IonHeader>

                <IonContent className="ion-padding"
                >

                    <div className="message-list">

                        <div className="message-list-container">

                            {this.state.messages.map((message, i, messages) => (
                                <Message
                                    key={message.guid}
                                    isMine={message.is_from_me}
                                    startsSequence={!messages[i - 1] || messages[i - 1].handle_id != message.handle_id}
                                    endsSequence={!messages[i + 1] || messages[i + 1].handle_id != message.handle_id}
                                    showTimestamp={false}
                                    data={message}
                                />
                            ))}
                            <div key="bottom" className={"bottom"} ref={this.bottomRef}/>
                        </div>

                    </div>
                </IonContent>
                <IonFooter className="ion-no-border">
                    <Compose chat={this.props.chat} rightItems={[
                        <ToolbarButton key="photo" icon="ios-camera"/>,
                        <ToolbarButton key="image" icon="ios-image"/>,
                        <ToolbarButton key="audio" icon="ion-ios-mic"/>,
                        <ToolbarButton key="money" icon="ion-ios-card"/>,
                        <ToolbarButton key="games" icon="ion-logo-game-controller-b"/>,
                        <ToolbarButton key="emoji" icon="ion-ios-happy"/>
                    ]}/>
                </IonFooter>

            </React.Fragment>
        )
    }

}