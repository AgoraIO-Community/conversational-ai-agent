import React, { createContext, useState, useContext, useEffect, useRef, useCallback, RefObject } from 'react';
import {AIAgentState, AgentState} from "@/utils/const"
import AgoraRTC, {
    IAgoraRTCClient,
    IAgoraRTCRemoteUser,
    ICameraVideoTrack,
    IMicrophoneAudioTrack,
    UID,
  } from 'agora-rtc-sdk-ng';
  import { useRouter } from 'next/navigation';
  import {AppRootContext} from "@/app/AppRootContext"
  import {AI_AGENT_UID} from "@/utils/const"
  

export interface UserContextInterface {
    users: IAgoraRTCRemoteUser[], 
    localUserContainerRef: RefObject<HTMLDivElement> | null, 
    isCameraOn: boolean, 
    maxVolumeUser: UID, 
    localUserId: UID, 
    toggleMute: () => void, 
    isMuted: boolean, 
    toggleCall: () => void, 
    isCallActive: boolean,
    remoteUsersContainerRef: RefObject<HTMLDivElement> | null
}

export const UserContext = createContext<UserContextInterface>({
    users:[], 
    localUserContainerRef: null, 
    isCameraOn: false, 
    maxVolumeUser: '', 
    localUserId: '', 
    toggleMute: () => {}, 
    isMuted: false, 
    toggleCall: () => {}, 
    isCallActive: false,
    remoteUsersContainerRef: null

})

export const UserProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const [users, setUsers] = useState<IAgoraRTCRemoteUser[]>([]);
    const [localTracks, setLocalTracks] = useState<
      [IMicrophoneAudioTrack | null,]
    >([null]);
    const [streamMessages, setStreamMessages] = useState<
      { uid: string; message: string }[]
    >([]);
    const isLocalUserJoined = useRef(false);
    const hasAttemptedJoin = useRef(false);
  
    const clientRef = useRef<IAgoraRTCClient | null>(null);
    const localUserContainerRef = useRef<HTMLDivElement>(null);
    const remoteUsersContainerRef = useRef<HTMLDivElement>(null);
    const [hasUserJoined, setHasUserJoined] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isCallActive, setIsCallActive] = useState(true);
    const [maxVolumeUser, setMaxVolumeUser] = useState<UID>('');
    const router = useRouter();
    

    const {
        appId: appID,
        channelId,
        localUserId,
        setLocalUserId,
        token,
      } = useContext(AppRootContext);
    
    const toggleMute = useCallback(async () => {
        if (localTracks[0]) {
          if (isMuted) {
            await localTracks[0].setEnabled(true);
          } else {
            await localTracks[0].setEnabled(false);
          }
          setIsMuted(!isMuted);
        }
      }, [localTracks, isMuted]);
    
      // const toggleCamera = useCallback(async () => {
      //   if (localTracks[1]) {
      //     if (isCameraOn) {
      //     await localTracks[1].setEnabled(false);
      //     } else {
      //       await localTracks[1].setEnabled(true);
      //     }
      //     setIsCameraOn(!isCameraOn);
      //   }
      // }, [localTracks, isCameraOn]);
    
      const toggleCall = useCallback(async () => {
        if (clientRef.current) {
          await clientRef.current.leave();
          console.log('Left channel successfully');
        }
        localTracks.forEach((track) => track?.close());
        setIsCallActive(!isCallActive);
        // window.location.reload();
        router.push('/');
      }, [isCallActive, localTracks]);
    
      useEffect(() => {
        if(users.length){
          const aiAgentUID = users.filter((item) => item.uid === AI_AGENT_UID);
    
        }
      },[users])

      const handleUserJoined = useCallback((user: IAgoraRTCRemoteUser) => {
        console.log('user joined', user, user.uid, AI_AGENT_UID);
        if(user.uid === AI_AGENT_UID){
          setUsers((prevUsers) => {
            if (!prevUsers.some((u) => u.uid === user.uid)) {
              return [...prevUsers, user];
            }
            return prevUsers;
          });  
        }
      }, []);
    
      const handleUserLeft = useCallback((user: IAgoraRTCRemoteUser) => {
        console.log('user left', user);
        if(user.uid === AI_AGENT_UID){
    
        }
        setUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid));
      }, []);
    
      const handleUserPublished = useCallback(
        async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
          if (!clientRef.current) return;
          if (user.uid === localUserId) {
            return;
          }
          console.log(`subscribing to user ${user}`);
          await clientRef.current.subscribe(user, mediaType);
    
          if (mediaType === 'video' && user.videoTrack) {
            console.log('subscribe video success');
            if (remoteUsersContainerRef.current) {
              user.videoTrack.play(remoteUsersContainerRef.current, {
                fit: 'cover',
              });
            } else {
              console.error('Remote users container not found');
            }
          }
          if (mediaType === 'audio' && user.audioTrack) {
            console.log('subscribe audio success');
            user.audioTrack.play();
          }
        },
        []
      );
    
      const handleStreamMessage = useCallback(
        (uid: number, payload: Uint8Array) => {
          const message = new TextDecoder().decode(payload);
          console.info(
            `received data stream message from ${uid}: `,
            payload,
            message
          );
    
          let parsedmessage;
          let parsedContent;
          try {
            parsedmessage = JSON.parse(message);
    
            try {
              parsedContent = JSON.parse(parsedmessage);
            } catch (e) {
              console.log(`Unable to parse Content - error - ${e}`);
            }
          } catch (e) {
            console.log(`Unable to parse message - error- ${e}`);
          }
    
          setStreamMessages((prev) => [...prev, { uid: uid.toString(), message }]);
        },
        []
      );
    
    useEffect(() => {
        if (hasAttemptedJoin.current) return;
        hasAttemptedJoin.current = true;
    
        let client:IAgoraRTCClient 
        const init = async () => {
          try {
            client  = await AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
            clientRef.current = client;
            client.on('user-left', handleUserLeft);
            client.on('user-joined', handleUserJoined)
            client.on('user-published', handleUserPublished);
            client.on('stream-message', handleStreamMessage);
    
            // const [microphoneTrack, cameraTrack] =
            //   await AgoraRTC.createMicrophoneAndCameraTracks();
            const microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack();
            client.on('volume-indicator', (volume) => {
              const user = volume.reduce((max, user) => {
                if (user.level > max.level) {
                  return user;
                }
                return max;
              }, volume[0]);
    
              console.log(user.uid);
    
              const { uid } = user;
              setMaxVolumeUser(uid);
            });
    
            // setLocalTracks([microphoneTrack, cameraTrack]);
            setLocalTracks([microphoneTrack]);
    
            // if (localUserContainerRef.current && cameraTrack) {
            //   cameraTrack.play(localUserContainerRef.current, { fit: 'cover' });
            // }
    
            let localUid;
            try {
              console.log(`Attempting to join channel - ${channelId}`);
              localUid = await client.join(appID, channelId, token, null);
            } catch (error) {
              console.log(`Unable to join channel - error - ${error}`);
            }
            console.log(
              `Local user joined channel successfully - userId - ${localUid} `
            );
            if(localUid){
              setLocalUserId(localUid);
            }
            isLocalUserJoined.current = true;
    
            // await client.publish([microphoneTrack, cameraTrack]);
            await client.publish([microphoneTrack]);
            console.log('Tracks published successfully');
    
            client.enableAudioVolumeIndicator();
          } catch (error) {
            console.error('Error during initialization:', error);
            hasAttemptedJoin.current = false; // Reset if join fails, allowing for retry
            router.push('/');
          }
        };
    
        init();
    
        return () => {
          client.off('user-joined', handleUserJoined);
          client.off('user-left', handleUserLeft);
          client.off('user-published', handleUserPublished);
          client.off('stream-message', handleStreamMessage);
    
          const cleanup = async () => {
            if (clientRef.current) {
              await clientRef.current.leave();
              console.log('Left channel successfully');
            }
            localTracks.forEach((track) => track?.close());
          };
    
          cleanup().catch((err) => console.error('Error during cleanup:', err));
        };
      }, []);
    

    return (
        <UserContext.Provider value={{ 
            users, 
            localUserContainerRef, 
            isCameraOn, 
            maxVolumeUser, 
            localUserId, 
            toggleMute, 
            isMuted, 
            toggleCall, 
            isCallActive,
            remoteUsersContainerRef
        }}>
            {children}
        </UserContext.Provider>
    )
} 