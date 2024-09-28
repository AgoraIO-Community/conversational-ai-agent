'use client';
import React, { useContext } from 'react';

import { AppRootContext } from '../../AppRootContext';
import { redirect } from 'next/navigation';

import { Separator } from '@/components/ui/separator';
import { AgentControl } from '@/components/ui/agentcontrol';
import { AgentProvider } from '@/app/AgentContext';
import { UserProvider } from '@/app/UserContext';
import { Users } from "@/components/ui/users"



const App: React.FC = () => {
  const { appId: appID, channelId} = useContext(AppRootContext);

  if (!appID || !channelId) {
    redirect('/');
  }


  return (
    <UserProvider>
      <AgentProvider>
        <div className="flex flex-col justify-center items-center">
          <div className="self-center w-1/2 my-10">
            <div>
              <div className="space-y-1 flex flex-row justify-between">
                <div>
                  <h4 className="text-lg font-medium leading-none">
                    Agora Conversational AI
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {/* Participants: {users.length + 1} */}
                    Participants: 
                  </p>
                </div>
                <AgentControl channel_name={channelId}/>
              </div>
              <Separator className="my-4" />
            </div>
          </div>
          <Users channel_name={channelId}/>
        </div>
      </AgentProvider>
    </UserProvider>
  );
};

export default App;
