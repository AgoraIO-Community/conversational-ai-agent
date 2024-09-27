'use client';
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useContext,
} from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  UID,
} from 'agora-rtc-sdk-ng';
import { AppRootContext } from '../../AppRootContext';
import { Badge } from '@/components/ui/badge';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Phone,
  PhoneOff,
  Loader2,
  Loader,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const AI_AGENT_UID = 123;
const AvatarUser = ({ imageUrl }: { imageUrl: string }) => {
  return (
    <Avatar style={{ zIndex: 1, width: '120px', height: '120px' }}>
      <AvatarImage src={imageUrl} alt="@shadcn" />
      <AvatarFallback></AvatarFallback>
    </Avatar>
  );
};

const Userbadge = ({ text }: { text: number | string }) => {
  return (
    <Badge
      variant="secondary"
      className="absolute bottom-3 right-3 p-2.5 border-0 z-[3]"
    >
      {text}
    </Badge>
  );
};

// import './App.css';

const App: React.FC = () => {
  const {
    appId: appID,
    channelId,
    localUserId,
    setLocalUserId,
    token,
  } = useContext(AppRootContext);
  const isLocalUserJoined = useRef(false);
  const hasAttemptedJoin = useRef(false);
  const [users, setUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [localTracks, setLocalTracks] = useState<
    [IMicrophoneAudioTrack | null,]
  >([null]);
  const [streamMessages, setStreamMessages] = useState<
    { uid: string; message: string }[]
  >([]);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localUserContainerRef = useRef<HTMLDivElement>(null);
  const remoteUsersContainerRef = useRef<HTMLDivElement>(null);
  const [hasUserJoined, setHasUserJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCallActive, setIsCallActive] = useState(true);
  const [maxVolumeUser, setMaxVolumeUser] = useState<UID>('');
  const router = useRouter();
  const [connectionState, setConnectionState] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');

  if (!appID || !channelId) {
    redirect('/');
  }

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

  const handleUserJoined = useCallback((user: IAgoraRTCRemoteUser) => {
    console.log('user joined', user);
    if (user.uid === localUserId) {
      return;
    }
    console.log({ userId: user.uid }, { localUserId });
    setUsers((prevUsers) => {
      if (!prevUsers.some((u) => u.uid === user.uid)) {
        return [...prevUsers, user];
      }
      return prevUsers;
    });
  }, []);

  const handleUserLeft = useCallback((user: IAgoraRTCRemoteUser) => {
    console.log('user left', user);
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

  const connectToAIAgent = async (action: 'start_agent' | 'stop_agent'): Promise<void> => {

    const apiUrl = '/api/proxy'; 
    const requestBody = {
      action, 
      channel_name: channelId,
      uid: AI_AGENT_UID
    };
    console.log({requestBody})
    try {
      setConnectionState('connecting');
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

      const data = await response.json();
      setConnectionState(action === 'start_agent' ? 'connected' : 'disconnected');
      console.log(
        `AI agent ${action === 'start_agent' ? 'connected' : 'disconnected'}`,
        data
      );
    } catch (error) {
      console.error(`Failed to ${action} AI agent connection:`, error);
      throw error;
    }
  };

  const handleConnectionToggle = useCallback(async () => {
    if (connectionState === 'disconnected') {
      setConnectionState('connecting');
      try {
        await connectToAIAgent('start_agent');
        setConnectionState('connected');
      } catch (error) {
        console.error('Connection failed:', error);
        setConnectionState('disconnected');
      }
    } else if (connectionState === 'connected') {
      setConnectionState('connecting');
      try {
        await connectToAIAgent('stop_agent');
        setConnectionState('disconnected');
      } catch (error) {
        console.error('Disconnection failed:', error);
        setConnectionState('connected');
      }
    }
  }, [connectionState]);

  useEffect(() => {
    if (hasAttemptedJoin.current) return;
    hasAttemptedJoin.current = true;

    console.log('Attempting to join channel');
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    const init = async () => {
      try {
        // const [microphoneTrack, cameraTrack] =
        //   await AgoraRTC.createMicrophoneAndCameraTracks();
        const microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack();
        client.on('user-joined', handleUserJoined);
        client.on('user-left', handleUserLeft);
        client.on('user-published', handleUserPublished);
        client.on('stream-message', handleStreamMessage);
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
    <div className="flex flex-col justify-center items-center">
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
            <div>
              <Button
                onClick={handleConnectionToggle}
                className={`
                  transition-colors
                  ${
                    connectionState === 'connected'
                      ? 'bg-red-500 hover:bg-red-600'
                      : ''
                  }
                  ${
                    connectionState === 'disconnected'
                      ? 'bg-green-500 hover:bg-green-600'
                      : ''
                  }
                `}
                disabled={connectionState === 'connecting'}
              >
                {connectionState === 'connecting' && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {connectionState === 'disconnected' && 'Connect Agent'}

                {connectionState === 'connected' && 'Disconnect'}
              </Button>
            </div>
          </div>
          <Separator className="my-4" />
        </div>
        {/* <Card>
          <CardContent>
              <h1>Agora Video Call</h1>
              <p>Participants: {users.length + 1}</p>
          </CardContent>
        </Card> */}
      </div>

      <div
        className={`grid gap-10 ${
          users.length ? 'grid-cols-2' : 'grid-cols-1'
        } justify-center h-1/2 max-w-screen-lg m-auto`}
      >
        <div>
          <Card
            ref={localUserContainerRef}
            className={`h-full ${
              users.length ? 'w-full' : 'w-[600px] m-auto'
            } aspect-video border border-solid border-gray-300 rounded-lg overflow-hidden relative mb-5`}
            id="localUser"
          >
            {!isCameraOn && (
              <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
                <AvatarUser imageUrl='https://github.com/shadcn.png' />
              </div>
            )}
            {maxVolumeUser === localUserId && (
              <span className="animate-ping absolute z-40 inline-flex h-5 w-5 rounded-full bg-sky-400 opacity-75"></span>
            )}
            <Userbadge text={'Local User'} />
          </Card>
          <div className="mt-auto  flex w-[300px] py-2  mx-auto justify-evenly items-center  rounded-[4px] my-5 ">
            <div className="flex space-x-4  border-t py-2 px-2">
              <button
                onClick={toggleMute}
                className="p-3 rounded-full bg-gray-700 shadow-md hover:bg-gray-600 transition-colors "
              >
                {isMuted ? (
                  <MicOff className="text-red-500 w-6 h-6" />
                ) : (
                  <Mic className="text-white-300 w-6 h-6" />
                )}
              </button>

              {/* <button
              onClick={toggleCamera}
              className="p-3 rounded-full bg-gray-700 shadow-md hover:bg-gray-600 transition-colors"
            >
              {isCameraOn ? (
                <Camera className="text-white-300 w-6 h-6" />
              ) : (
                <CameraOff className="text-red-500 w-6 h-6" />
              )}
            </button> */}

              <button
                onClick={toggleCall}
                className="p-3 rounded-full bg-gray-700 shadow-md hover:bg-gray-600 transition-colors "
              >
                {isCallActive ? (
                  <PhoneOff className="text-red-500 w-6 h-6" />
                ) : (
                  <Phone className="text-white-300 w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {users.length > 0 && (
          <div>
            <Card
              ref={remoteUsersContainerRef}
              className="w-full h-full aspect-video border border-solid border-gray-300 rounded-lg overflow-hidden relative"
              id={`remote-user-${users[0].uid}`}
            >
              {!users[0].videoTrack && (
                <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
                  <AvatarUser imageUrl={'https://img.freepik.com/premium-vector/ai-logo-template-vector-with-white-background_1023984-15077.jpg?w=360'} />
                </div>
              )}
              {maxVolumeUser === users[0].uid && (
                <span className="animate-ping absolute z-40 inline-flex h-5 w-5 rounded-full bg-sky-400 opacity-75"></span>
              )}
              <Userbadge text={users[0].uid === AI_AGENT_UID ? "AI Agent": users[0].uid} />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
