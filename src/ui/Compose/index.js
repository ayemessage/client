import React from 'react';
import './Compose.css';
import dataflow from "../../dataflow";

export default class Compose extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            message: ""
        }
    }

    keyPressed(event) {
        if (event.key === 'Enter') {
            try {
                dataflow.sendMessage({
                    chat_identifier: this.props.chat.chat_identifier,
                    text: this.state.message,
                    attachments: null
                })
                this.setState({
                    message: ""
                });
            } catch (e) {
                console.error(e);
            }
        }
    }

    updateInputValue(evt) {
        this.setState({
            message: evt.target.value
        });
    }

    render() {
        return (
            <div className="compose">
                <input
                    type="text"
                    className="compose-input"
                    placeholder="Type your message here"
                    onKeyDown={this.keyPressed.bind(this)}
                    onChange={this.updateInputValue.bind(this)}
                    value={this.state.message}
                />

                {
                    this.props.rightItems
                }
            </div>
        );
    }
}