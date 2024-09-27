import React, { createContext, useState } from 'react';
import { UID } from 'agora-rtc-sdk-ng';

export interface AppRootContextInterface {
  appId: string;
  channelId: string;
  localUserName: string;
  setUserName: React.Dispatch<React.SetStateAction<string>>;
  localUserId: UID;
  serLocalUserId: React.Dispatch<React.SetStateAction<UID>>;
  token: string;
  setToken: (token: string) => void;
}

export const AppRootContext = createContext<AppRootContextInterface>({
  appId: '',
  channelId: '',
  localUserName: '',
  localUserId: '',
  serLocalUserId: () => {},
  setUserName: () => {},
  token: '',
  setToken: () => {},
});

export const AppRootProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [localUserName, setUserName] = React.useState<string>('0');
  const [localUserId, serLocalUserId] = React.useState<UID>('0');
  const [token, setToken] = React.useState<string>('');

  const value = {
    appId: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
    channelId: process.env.NEXT_PUBLIC_AGORA_CHANNEL_NAME!,
    localUserName,
    setUserName,
    localUserId,
    serLocalUserId,
    token,
    setToken,
  };

  return (
    <AppRootContext.Provider value={value}>{children}</AppRootContext.Provider>
  );
};
