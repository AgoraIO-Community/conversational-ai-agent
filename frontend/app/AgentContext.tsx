import React, { createContext, useState } from 'react';
import {AIAgentState, AgentState} from "@/utils/const"

export interface AgentContextInterface {
    agentConnectionState:AIAgentState,
    setAgentConnectionState: (agentState: AIAgentState) => void,

}

export const AgentContext = createContext<AgentContextInterface>({
    agentConnectionState: AgentState.NOT_CONNECTED,
    setAgentConnectionState: () => {}
})

export const AgentProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const [agentConnectionState, setAgentConnectionState] = useState<AIAgentState>(AgentState.NOT_CONNECTED);

    const value = {
        agentConnectionState,
        setAgentConnectionState
    }
    return (
        <AgentContext.Provider value={value}>
            {children}
        </AgentContext.Provider>
    )
} 