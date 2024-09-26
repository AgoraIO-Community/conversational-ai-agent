import React, { createContext, useState } from "react";
import { UID } from 'agora-rtc-sdk-ng';

export interface AppRootContextInterface {
  appId: string;
  setAppId: React.Dispatch<React.SetStateAction<string>>;
  channelId: string;
  setChannelId: React.Dispatch<React.SetStateAction<string>>;
  localUserName: string;
  setUserName: React.Dispatch<React.SetStateAction<string>>;
  localUserId: UID;
  serLocalUserId: React.Dispatch<React.SetStateAction<UID>>;
}

export const AppRootContext = createContext<AppRootContextInterface>({
  appId: "",
  channelId: "",
  localUserName: "",
  localUserId: "",
  serLocalUserId: () => {},
  setAppId: () => {},
  setChannelId: () => {},
  setUserName: () => {},
});

export const AppRootProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => { // Added return type
  const [appId, setAppId] = useState<string>("aab8b8f5a8cd4469a63042fcfafe7063"); 
  const [channelId, setChannelId] = useState<string>("realtimekit_agora"); 
  const [localUserName, setUserName] = useState<string>("8800"); 
  const [localUserId, serLocalUserId] = useState<UID>(""); 

  return (
    <AppRootContext.Provider         
      value={{
        appId,
        setAppId,
        channelId,
        setChannelId,
        localUserName,
        setUserName,
        localUserId,
        serLocalUserId
      }}
    >
      {children}
    </AppRootContext.Provider>
  );
}