import React from 'react';
import chat from '../../models/chat';
import Messages from "./messages";
import dataflow from "../../dataflow";
import {
  IonApp,
  IonAvatar,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonPage,
  IonSplitPane,
  IonTitle,
  IonToolbar
} from '@ionic/react';


export default class Chats extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      activeChat: false,
      chats: []
    };

    this.updateChats();

    dataflow.on('chatsUpdated', this.updateChats.bind(this));
  }

  async updateChats() {
    let chats = await chat.query().orderBy('last_message.date').desc().toArray();

    this.setState({
      chats
    });
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
      <IonApp>
        <IonSplitPane contentId="main">
          <IonMenu contentId="main">
            <IonHeader>
              <IonToolbar>
                <IonTitle>Threads</IonTitle>
              </IonToolbar>
            </IonHeader>
            <IonList>
              {this.state.chats.map(chat => (
                <IonItem key={chat.guid} onClick={() => this.selectChat(chat)}>
                  <IonAvatar src={""}/>
                  <IonLabel>
                    <h2>{chat.getChatName()}</h2>
                    <p>{chat.last_message ? chat.last_message.text : ""}</p>
                  </IonLabel>
                </IonItem>
              ))}


            </IonList>
          </IonMenu>
          <IonPage id="main">
            {this.state.activeChat ? (
              <Messages chat={this.state.activeChat}/>
            ) : (
              <IonContent className="ion-padding">
                <div>No Active Chat Selected</div>
              </IonContent>
            )}
          </IonPage>
        </IonSplitPane>
      </IonApp>
    )
  }
}
