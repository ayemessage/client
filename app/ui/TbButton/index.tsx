import React from 'react';
import './ToolbarButton.css';
import {IonIcon} from "@ionic/react";
import * as icons from 'ionicons/icons'

export default function ToolbarButton(props) {
  const {icon} = props;
  return (
    <IonIcon icon={icons[icon]} className={`toolbar-button`}/>

  );
}
