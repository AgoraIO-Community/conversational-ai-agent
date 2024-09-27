import React, { createContext, useState, useEffect } from 'react';
import { UID } from 'agora-rtc-sdk-ng';

export interface AppRootContextInterface {
  appId: string;
  channelId: string;
  setChannelId: React.Dispatch<React.SetStateAction<string>>;
  localUserName: string;
  setUserName: React.Dispatch<React.SetStateAction<string>>;
  localUserId: UID;
  setLocalUserId: React.Dispatch<React.SetStateAction<UID>>;
  token: string;
  setToken: (token: string) => void;
}

export const AppRootContext = createContext<AppRootContextInterface>({
  appId: '',
  channelId: '',
  setChannelId: () => {},
  localUserName: '',
  localUserId: '',
  setLocalUserId: () => {},
  setUserName: () => {},
  token: '',
  setToken: () => {},
});

export const AppRootProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [localUserName, setUserName] = React.useState<string>('0');
  const [localUserId, setLocalUserId] = React.useState<UID>('0');
  const [token, setToken] = React.useState<string>('');
  const [channelId, setChannelId] = React.useState<string>('');

  useEffect(() => {
    const generateChannelId = () => {
      const characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 16; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }
      return result;
    };

    setChannelId(generateChannelId());
  }, []);

  const value = {
    appId: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
    channelId,
    setChannelId,
    localUserName,
    setUserName,
    localUserId,
    setLocalUserId,
    token,
    setToken,
  };

  return (
    <AppRootContext.Provider value={value}>{children}</AppRootContext.Provider>
  );
};
