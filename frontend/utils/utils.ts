import AgoraRTC, {
    IAgoraRTCClient,
    IAgoraRTCRemoteUser,
    ICameraVideoTrack,
    IMicrophoneAudioTrack,
    UID,
  } from 'agora-rtc-sdk-ng';

const AI_AGENT_UID:UID = '123';

export async function waitForRemoteUser(client:IAgoraRTCClient) {
    // if (remoteUsers.length > 0) {
    //     return remoteUsers[0];
    // }
    console.log("Waiting for AI agent to join the channel")
    return new Promise((resolve, reject) => {
        // Listen for a user joining
        console.log({client})
        if(client)
        client.on("user-joined", (user: IAgoraRTCRemoteUser) => {
            console.log(`Remote user join the channel ${user.uid}`)
            if(user.uid === AI_AGENT_UID){
                resolve(user);
            }
        });
    });
}