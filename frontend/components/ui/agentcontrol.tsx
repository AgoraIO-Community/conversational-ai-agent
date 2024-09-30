import React, { useContext, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AI_AGENT_STATE, AIAgentState, AgentState, AI_AGENT_UID} from "@/utils/const"
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { AgentContext } from '@/app/AgentContext';
import { UserContext } from '@/app/UserContext';

const connectToAIAgent = async (agentAction: 'start_agent' | 'stop_agent', channel_name: string): Promise<void> => {

    const apiUrl = '/api/proxy'; 
    const requestBody = {
      action: agentAction, 
      channel_name: channel_name,
      uid: AI_AGENT_UID
    };
    console.log({requestBody})
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // const data = await response.json();
      console.log({agentResponse: response})

      // console.log({data})
      console.log(
        `AI agent ${agentAction === 'start_agent' ? 'connected' : 'disconnected'}`, 
        response
      );
    } catch (error) {
      console.error(`Failed to ${agentAction} AI agent connection:`, error);
      throw error;
    }
};

export const AgentControl: React.FC<{channel_name: string}> = ({channel_name}) => {
    const {agentConnectionState, setAgentConnectionState} = useContext(AgentContext);
    const { users } = useContext(UserContext)
    const { toast } = useToast()  
    console.log("Agent Control--", {agentConnectionState}, {bth: AI_AGENT_STATE[agentConnectionState]})

      const handleConnectionToggle = async () => {
        try{
          // connect to agent when agent is in not connected state or when earlier connect failed
          if (agentConnectionState === AgentState.NOT_CONNECTED || agentConnectionState === AgentState.AGENT_REQUEST_FAILED){
            try{
              setAgentConnectionState(AgentState.REQUEST_SENT);
              await connectToAIAgent('start_agent', channel_name);
              setAgentConnectionState(AgentState.AWAITING_JOIN);
              toast({title: "Agent requested to join"})

            }catch(agentConnectError){
              setAgentConnectionState(AgentState.AGENT_REQUEST_FAILED);
              toast({
                title: "Uh oh! Agent failed to connect",
                description: `${agentConnectError}`,
                variant: "destructive",
                action: <ToastAction altText="Try again">Try again</ToastAction>,
              })
              throw agentConnectError
            }
          }
          // disconnect agent with agent is already connected or when earlier disconnect failed
          if(agentConnectionState === AgentState.AGENT_CONNECTED || agentConnectionState === AgentState.AGENT_DISCONNECT_FAILED){
            try{
              setAgentConnectionState(AgentState.AGENT_DISCONNECT_REQUEST);
              await connectToAIAgent('stop_agent', channel_name);
              setAgentConnectionState(AgentState.AWAITING_LEAVE);
              toast({ title: "Agent disconnecting..."})
            }catch(agentDisconnectError){
              setAgentConnectionState(AgentState.AGENT_DISCONNECT_FAILED);
              toast({
                title: "Uh oh! Agent failed to disconnect",
                description: `${agentDisconnectError}`,
                variant: "destructive",
                action: <ToastAction altText="Try again">Try again</ToastAction>,
              })
              throw agentDisconnectError
            }
          }
        }catch(error){
          console.log(`Agent failed to connect/disconnect - ${error}`)
        }
      };
    
      useEffect(() => {
        console.log("agent contrl", {users})
        // welcome agent
        if(users.length){
          const aiAgentUID = users.filter((item) => item.uid === AI_AGENT_UID);
          console.log("agent contrl",{aiAgentUID})
          if(aiAgentUID.length){
            setAgentConnectionState(AgentState.AGENT_CONNECTED);
            toast({title: "Say Hi!!"})
          }
        }
        // when agent leaves, show left toast, and set agent to not connected state
        if(!users.length && agentConnectionState === AgentState.AWAITING_LEAVE){
            toast({ title: "Agent left the call"})
            setAgentConnectionState(AgentState.NOT_CONNECTED);
        }
      },[users])

    const isLoading = (agentConnectionState === AgentState.REQUEST_SENT 
        || agentConnectionState === AgentState.AGENT_DISCONNECT_REQUEST 
        || agentConnectionState === AgentState.AWAITING_LEAVE 
        || agentConnectionState === AgentState.AWAITING_JOIN)

    return(
        <div>
        <Button
        onClick={handleConnectionToggle}
        className={`
            transition-colors
            ${
            agentConnectionState === AgentState.NOT_CONNECTED
                ? 'bg-green-500 hover:bg-green-600'
                : ''
            }
            ${
            agentConnectionState === AgentState.AGENT_CONNECTED
                ? 'bg-red-500 hover:bg-red-600'
                : ''
            }
        `}
        disabled={isLoading}
        >
        {isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}

        {`${AI_AGENT_STATE[agentConnectionState]}` }
        </Button>
        </div>
    )
}
