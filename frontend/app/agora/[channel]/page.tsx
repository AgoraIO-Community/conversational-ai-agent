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
import { Mic, MicOff, Camera, CameraOff, Phone, PhoneOff, Loader2, Loader } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAudioVisualization } from '@/hooks/useAudioVisualization';

const AvatarUser = () => {
  return (
    <Avatar style={{ zIndex: 1, width: '120px', height: '120px' }}>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
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
    serLocalUserId,
    token,
  } = useContext(AppRootContext);
  const isLocalUserJoined = useRef(false);
  const hasAttemptedJoin = useRef(false);
  const [users, setUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [localTracks, setLocalTracks] = useState<
    [IMicrophoneAudioTrack | null, ICameraVideoTrack | null]
  >([null, null]);
  const [streamMessages, setStreamMessages] = useState<
    { uid: string; message: string }[]
  >([]);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localUserContainerRef = useRef<HTMLDivElement>(null);
  const remoteUsersContainerRef = useRef<HTMLDivElement>(null);
  const [hasUserJoined, setHasUserJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isCallActive, setIsCallActive] = useState(true);
  const [maxVolumeUser, setMaxVolumeUser] = useState<UID>('');
  const router = useRouter();
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicrophone, setSelectedMicrophone] = useState<string | null>(null);
  const { waveformData, startVisualization, stopVisualization } = useAudioVisualization();


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

  const toggleCamera = useCallback(async () => {
    if (localTracks[1]) {
      if (isCameraOn) {
        await localTracks[1].setEnabled(false);
      } else {
        await localTracks[1].setEnabled(true);
      }
      setIsCameraOn(!isCameraOn);
    }
  }, [localTracks, isCameraOn]);

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
          user.videoTrack.play(remoteUsersContainerRef.current, { fit: 'cover' });
        } else {
          console.error("Remote users container not found");
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



  const connectToAIAgent = async (action: 'start' | 'stop'): Promise<void> => {
    const apiUrl = `${process.env.NEXT_PUBLIC_AGORA_AI_AGENT_URL}/${action}`;
    const requestBody = {
      cname: "realtimekit_agora"
    };

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
      setConnectionState(action === 'start' ? 'connected' : 'disconnected');
      console.log(`AI agent ${action === 'start' ? 'connected' : 'disconnected'}`, data);
    } catch (error) {
      console.error(`Failed to ${action} AI agent connection:`, error);
      throw error;
    }

  };

  const handleConnectionToggle = useCallback(async () => {
    if (connectionState === 'disconnected') {
      setConnectionState('connecting');
      try {
        await connectToAIAgent('start');
        setConnectionState('connected');
      } catch (error) {
        console.error('Connection failed:', error);
        setConnectionState('disconnected');
      }
    } else if (connectionState === 'connected') {
      setConnectionState('connecting');
      try {
        await connectToAIAgent('stop');
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
        const [microphoneTrack, cameraTrack] =
          await AgoraRTC.createMicrophoneAndCameraTracks();

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

        setLocalTracks([microphoneTrack, cameraTrack]);

        if (localUserContainerRef.current && cameraTrack) {
          cameraTrack.play(localUserContainerRef.current, { fit: 'cover' });
        }

        let localUid = ""
        try {
          await client.join(appID, channelId, token, null);
        } catch (error) {
          console.log(`Unable to join channel - error - ${error}`)

        }
        console.log(
          `Local user joined channel successfully - userId - ${localUid} `
        );
        serLocalUserId(localUid);
        isLocalUserJoined.current = true;

        await client.publish([microphoneTrack, cameraTrack]);
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

  useEffect(() => {
    const getAvailableMicrophones = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const microphones = devices.filter(device => device.kind === 'audioinput');
      setAvailableMicrophones(microphones);
      if (microphones.length > 0) {
        setSelectedMicrophone(microphones[0].deviceId);
      }
    };

    getAvailableMicrophones();
  }, []);

  useEffect(() => {
    if (localTracks[0] && selectedMicrophone) {
      localTracks[0].setDevice(selectedMicrophone);
    }
  }, [selectedMicrophone, localTracks]);

  useEffect(() => {
    if (localTracks[0]) {
      const audioTrack = localTracks[0];
      startVisualization(audioTrack.getMediaStreamTrack());
    }
    return () => {
      stopVisualization();
    };
  }, [localTracks, startVisualization, stopVisualization]);

  return (
    <div className="container mx-auto px-4 py-8">
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
                  ${connectionState === 'connected' ? 'bg-red-500 hover:bg-red-600' : ''}
                  ${connectionState === 'disconnected' ? 'bg-green-500 hover:bg-green-600' : ''}
                `}
                  disabled={connectionState === 'connecting'}
                >
                  {connectionState === 'connecting' && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {connectionState === 'disconnected' && 'Connect'}

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
          className={`grid gap-10 ${users.length ? 'grid-cols-2' : 'grid-cols-1'
            } justify-center h-1/2 max-w-screen-lg m-auto`}
        >
          <div>
            <Card
              ref={localUserContainerRef}
              className={`h-full ${users.length ? 'w-full' : 'w-[600px] m-auto'
                } aspect-video border border-solid border-gray-300 rounded-lg overflow-hidden relative mb-5`}
              id="localUser"
            >
              {!isCameraOn && (
                <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
                  <AvatarUser />
                </div>
              )}
              {maxVolumeUser === localUserId && (
                <span className="animate-ping absolute z-40 inline-flex h-5 w-5 rounded-full bg-sky-400 opacity-75"></span>
              )}
              <Userbadge text={'Local User'} />
            </Card>
            <div className="mt-auto  flex w-[300px] py-2 border-t  mx-auto justify-evenly items-center  rounded-[4px] my-5 ">
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

              <button
                onClick={toggleCamera}
                className="p-3 rounded-full bg-gray-700 shadow-md hover:bg-gray-600 transition-colors"
              >
                {isCameraOn ? (
                  <Camera className="text-white-300 w-6 h-6" />
                ) : (
                  <CameraOff className="text-red-500 w-6 h-6" />
                )}
              </button>

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


          {users.length > 0 && (
            <div>
              <Card
                ref={remoteUsersContainerRef}
                className="w-full h-full aspect-video border border-solid border-gray-300 rounded-lg overflow-hidden relative"
                id={`remote-user-${users[0].uid}`}
              >
                {maxVolumeUser === users[0].uid && (
                  <span className="animate-ping absolute z-40 inline-flex h-5 w-5 rounded-full bg-sky-400 opacity-75"></span>
                )}
                <Userbadge text={users[0].uid} />
              </Card>
            </div>
          )}



        </div>

      </div>
      <div className="lg:w-1/4 mt-8 lg:mt-0">
        <div className="border border-gray-300 p-4 rounded-lg">
          <h2 className="text-lg font-medium mb-5">Audio Settings</h2>
          <Select onValueChange={setSelectedMicrophone} value={selectedMicrophone || undefined}>
            <SelectTrigger className="w-full w-[300px]">
              <SelectValue placeholder="Select a microphone" />
            </SelectTrigger>
            <SelectContent>
              {availableMicrophones.map((mic) => (
                <SelectItem key={mic.deviceId} value={mic.deviceId}>
                  {mic.label || `Microphone ${mic.deviceId.slice(0, 5)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-4">
            <div className="h-20 bg-gray-800 rounded-md overflow-hidden">
              {waveformData.map((value, index) => (
                <div
                  key={index}
                  className="inline-block w-1 bg-white"
                  style={{
                    height: `${value * 100}%`,
                    marginRight: '1px',
                  }}
                />
              ))}
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default App;
