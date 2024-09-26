import { createContext } from "react";

export interface AppRootContextInterface {
  appId: string;
  setAppId: React.Dispatch<React.SetStateAction<string>>;
  channelId: string;
  setChannelId: React.Dispatch<React.SetStateAction<string>>;
  userId: string;
  setUserId: React.Dispatch<React.SetStateAction<string>>;
}
export const AppRootContext = createContext<AppRootContextInterface>({
  appId: "",
  channelId: "",
  userId: "",
  setAppId: () => {},
  setChannelId: () => {},
  setUserId: () => {},
});
