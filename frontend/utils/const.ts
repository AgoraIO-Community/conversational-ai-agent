import{ UID} from 'agora-rtc-sdk-ng';

export const AI_AGENT_STATE = {
    'NOT_CONNECTED': "Connect Agent",
    'REQUEST_SENT': "Requesting agent join..",
    'AWAITING_JOIN': "Waiting for agent to Join",
    "AGENT_CONNECTED": "Disconnect Agent",
    'AGENT_REQUEST_FAILED': 'Agent failed to connect - Try again',
    'AGENT_DISCONNECT_REQUEST': 'Disconnecting agent...',
    'AGENT_DISCONNECT_FAILED': 'Agent failed to disconnect - Try again',
} as const;

export type AIAgentState = keyof typeof AI_AGENT_STATE

export const AGENT_STATE_TO_API_ACTION = {
    'NOT_CONNECTED': 'start_agent',
    'AGENT_CONNECTED': 'stop_agent'
} as const;

export type AgentStateToApiAction = keyof typeof AGENT_STATE_TO_API_ACTION; 

export const enum AgentState {
    NOT_CONNECTED = 'NOT_CONNECTED',
    REQUEST_SENT = 'REQUEST_SENT',
    AWAITING_JOIN = 'AWAITING_JOIN',
    AGENT_CONNECTED = 'AGENT_CONNECTED',
    AGENT_REQUEST_FAILED = 'AGENT_REQUEST_FAILED',
    AGENT_DISCONNECT_REQUEST= 'AGENT_DISCONNECT_REQUEST',
    AGENT_DISCONNECT_FAILED= 'AGENT_DISCONNECT_FAILED',

}

export const AI_AGENT_UID:UID = 123;
