import React from 'react';
import message from "../../models/message";
import {ChatFeed, Message} from 'react-chat-ui'


export default class Messages extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            messages: [],
            is_typing: false,
        }
    }

    componentDidMount() {
        this.updateMessages();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.chatId == this.props.chatId) return;
        this.state.messages = [];
        this.updateMessages();
    }

    async updateMessages() {
        console.log(this.props);
        let messages = this.state.messages;
        await message.query().where({'chat_id': this.props.chatId}).reverse().limit(100).each(message => {
            if (this.state.messages.find(m => m.guid == message.guid)) return;
            let messageObject = new Message({
                id: message.is_from_me ? 0 : message.handle_id,
                message: message.text,
                senderName: message.handle_id
            });
            messageObject.guid = message.guid;
            messageObject._cocoa_date = message._cocoa_date;

            messages.push(messageObject)
        });

        messages = messages.sort((a, b) => a._cocoa_date < b._cocoa_date ? -1 : 1)

        this.setState({messages});
    }

    render() {
        return (
            <ChatFeed
                messages={this.state.messages} // Boolean: list of message objects
                showSenderName={true}
            />
        )
    }

}