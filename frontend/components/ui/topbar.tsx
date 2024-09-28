import React, {useContext} from 'react';

import { Separator } from '@/components/ui/separator';
import { AgentControl } from '@/components/ui/agentcontrol';
import { UserContext } from '@/app/UserContext';

export const Topbar: React.FC<{channel_name: string}> = ({channel_name}) => {
    const { users } = useContext(UserContext)

    return (
        <div className="self-center w-1/2 my-10">
        <div>
        <div className="space-y-1 flex flex-row justify-between">
            <div>
            <h4 className="text-lg font-medium leading-none">
                Agora Conversational AI
            </h4>
            <p className="text-sm text-muted-foreground">
                Participants: {users.length + 1}
            </p>
            </div>
            <AgentControl channel_name={channel_name}/>
        </div>
        <Separator className="my-4" />
        </div>
        </div>
    )
}
