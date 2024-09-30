'use client';
import React, { useContext } from 'react';
import { AppRootContext } from '../../AppRootContext';
import { redirect } from 'next/navigation';
import { AgentProvider } from '@/app/AgentContext';
import { UserProvider } from '@/app/UserContext';
import { Users } from "@/components/ui/users"
import { Topbar } from '@/components/ui/topbar';



const App: React.FC = () => {
  const { appId: appID, channelId} = useContext(AppRootContext);

  if (!appID || !channelId) {
    redirect('/');
  }


  return (
    <UserProvider>
      <AgentProvider>
        <div className="flex flex-col justify-center items-center">
          <Topbar channel_name={channelId}/>
          <Users channel_name={channelId}/>
        </div>
      </AgentProvider>
    </UserProvider>
  );
};

export default App;
