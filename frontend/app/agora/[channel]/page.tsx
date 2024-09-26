'use client'
import React, { useEffect, useState, useRef, useCallback, useContext } from 'react';
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { AppRootContext } from "../../AppRootContext";
import { Badge } from "@/components/ui/badge"
import { redirect } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Mic, MicOff, Camera, CameraOff, Phone, PhoneOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation";

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}


const AvatarUser = () => {
  return (
    <Avatar style={{ zIndex: 1, width: '120px', height: '120px' }}>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback></AvatarFallback>
    </Avatar>
  );
}

const ActiveSpeakerAnimation = ({ isActive }: { isActive: boolean }) => {
  if (!isActive) return null;

  return (
    <div className="active-speaker-waveform">
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
    </div>
  );
};


const Userbadge = ({ text }: { text: number | string }) => {
  return (<Badge variant="secondary" className="absolute bottom-3 right-3 p-2.5 border-0 z-[3]">{text}</Badge>)
}

const RemoteUser: React.FC<{ user: IAgoraRTCRemoteUser, hasUserJoined: boolean }> = ({ user, hasUserJoined }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user.videoTrack && containerRef.current) {
      user.videoTrack.play(containerRef.current);
    }
    return () => {
      user.videoTrack?.stop();
    };
  }, [hasUserJoined]);

  return (
    <Card
      ref={containerRef}
      className='w-full h-full aspect-video border border-solid border-gray-300 rounded-lg overflow-hidden relative'
      id={`remote-user-${user.uid}`}
    >
      <Userbadge text={user.uid} />
    </Card>
  );
};


// import './App.css';

const App: React.FC = () => {
  const { appId: appID, channelId, localUserName, localUserId, serLocalUserId } = useContext(AppRootContext);
  const isLocalUserJoined = useRef(false)
  useEffect(() => {
    console.log("debugging a", channelId, appID, localUserName);
  }, [channelId, appID, localUserName]);
  const [users, setUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [localTracks, setLocalTracks] = useState<[IMicrophoneAudioTrack | null, ICameraVideoTrack | null]>([null, null]);
  const [streamMessages, setStreamMessages] = useState<{ uid: string; message: string }[]>([]);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localUserContainerRef = useRef<HTMLDivElement>(null);
  const remoteUsersContainerRef = useRef<HTMLDivElement>(null);
  const [hasUserJoined, setHasUserJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isCallActive, setIsCallActive] = useState(true);
  const [activeSpeaker, setActiveSpeaker] = useState<number | null>(null);
  const router = useRouter();

  const debouncedSetActiveSpeaker = useRef(debounce((uid: number | null) => {
    debugger
    setActiveSpeaker(uid);
  }, 100));
  const lastActiveTimeRef = useRef<number>(0);
  const volumeHistoryRef = useRef<{ [uid: string]: number[] }>({});

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
    localTracks.forEach(track => track?.close());
    setIsCallActive(!isCallActive);
    // window.location.reload();
    router.push("/")

  }, [isCallActive, localTracks]);

  const handleUserJoined = useCallback((user: IAgoraRTCRemoteUser) => {
    console.log("user joined", user);
    if (user.uid === localUserId) {
      return
    }
    console.log({ userId: user.uid }, { localUserId })
    setUsers(prevUsers => {
      if (!prevUsers.some(u => u.uid === user.uid)) {
        return [...prevUsers, user];
      }
      return prevUsers;
    });
  }, []);

  const handleUserLeft = useCallback((user: IAgoraRTCRemoteUser) => {
    console.log("user left", user);
    setUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid));
  }, []);

  const handleUserPublished = useCallback(async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    if (!clientRef.current) return;
    if (user.uid === localUserId) {
      return
    }
    console.log(`subscribing to user ${user}`)
    await clientRef.current.subscribe(user, mediaType);

    if (mediaType === "video" && user.videoTrack) {
      console.log("subscribe video success");
      // if (remoteUsersContainerRef.current) {
      setHasUserJoined(true);
      // } else {
      //   console.error("Remote users container not found");
      // }
    }
    if (mediaType === "audio" && user.audioTrack) {
      console.log("subscribe audio success");
      user.audioTrack.play();
    }
  }, []);

  const handleStreamMessage = useCallback((uid: number, payload: Uint8Array) => {
    const message = new TextDecoder().decode(payload);
    console.info(`received data stream message from ${uid}: `, payload, message);

    let parsedmessage
    let parsedContent
    try {
      parsedmessage = JSON.parse(message);

      try {
        parsedContent = JSON.parse(parsedmessage)
      } catch (e) {
        console.log(`Unable to parse Content - error - ${e}`)
      }
    } catch (e) {
      console.log(`Unable to parse message - error- ${e}`)
    }

    setStreamMessages(prev => [...prev, { uid: uid.toString(), message }]);
  }, []);



  const handleVolumeIndicator = useCallback((volumes: { level: number; uid: number | string }[]) => {
    const currentTime = Date.now();

    volumes.forEach(({ level, uid }) => {
      if (!volumeHistoryRef.current[uid]) {
        volumeHistoryRef.current[uid] = [];
      }
      volumeHistoryRef.current[uid].push(level);
      if (volumeHistoryRef.current[uid].length > 10) {
        volumeHistoryRef.current[uid].shift();
      }
    });

    const significantSpeaker = Object.entries(volumeHistoryRef.current).find(([_, history]) => {
      const average = history.reduce((sum, val) => sum + val, 0) / history.length;
      const variance = history.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / history.length;
      return average > 30 && variance > 100; // Adjust these thresholds as needed
    });

    if (significantSpeaker) {
      const [uid] = significantSpeaker;
      lastActiveTimeRef.current = currentTime;
      debouncedSetActiveSpeaker.current(Number(uid))
    } else if (activeSpeaker !== null && currentTime - lastActiveTimeRef.current > 1000) {
      debouncedSetActiveSpeaker.current(null)
    }

    console.log('Volume histories:', volumeHistoryRef.current);
  }, [activeSpeaker]);



  useEffect(() => {
    if (isLocalUserJoined.current) return
    console.log({ isLocalUserJoined: isLocalUserJoined.current }, 'user')
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    client.enableAudioVolumeIndicator();
    clientRef.current = client;

    const init = async () => {
      try {

        const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        setLocalTracks([microphoneTrack, cameraTrack]);

        if (localUserContainerRef.current && cameraTrack) {
          cameraTrack.play(localUserContainerRef.current, { fit: 'cover' });
        }
        const localUid = await client.join(appID, channelId, null, null);
        console.log(`Local user joined channel successfully - userId - ${localUid} `);
        serLocalUserId(localUid)
        isLocalUserJoined.current = true
        await client.publish([microphoneTrack, cameraTrack]);
        console.log('Tracks published successfully');

        client.on("user-joined", handleUserJoined);
        client.on("user-left", handleUserLeft);
        client.on("user-published", handleUserPublished);
        client.on("stream-message", handleStreamMessage);
        client.on("volume-indicator", handleVolumeIndicator);

      } catch (error) {
        console.error('Error during initialization:', error);
      }
    };

    init();

    return () => {
      client.off("user-joined", handleUserJoined);
      client.off("user-left", handleUserLeft);
      client.off("user-published", handleUserPublished);
      client.off("stream-message", handleStreamMessage);

      const cleanup = async () => {
        if (clientRef.current) {
          await clientRef.current.leave();
          console.log('Left channel successfully');
        }
        localTracks.forEach(track => track?.close());
      };

      cleanup().catch(err => console.error('Error during cleanup:', err));
    };
  }, []);

  return (
    <div className="flex flex-col justify-center items-center">
      <div className='self-center w-1/2 my-10'>
        <div>
          <div className="space-y-1">
            <h4 className="text-lg font-medium leading-none">Agora Conversational AI</h4>
            <p className="text-sm text-muted-foreground">
              Participants: {users.length + 1}
            </p>
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

      <div className={`grid gap-10 ${users.length ? "grid-cols-2" : "grid-cols-1"
        } justify-center h-1/2 max-w-screen-lg m-auto`}>
        <div >
          <Card
            ref={localUserContainerRef}
            className={`h-full ${users.length ? 'w-full' : 'w-[600px] m-auto'} aspect-video border border-solid border-gray-300 rounded-lg overflow-hidden relative mb-5`}
            id="localUser"
          >
            {!isCameraOn && <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center"><AvatarUser /></div>}
            <Userbadge text={'Local User'} />
            <ActiveSpeakerAnimation isActive={activeSpeaker === localUserId} />
          </Card>

          <div className="mt-auto  flex w-[300px] py-2 border-t  mx-auto justify-evenly items-center  rounded-[4px] my-5 ">

            <button
              onClick={toggleMute}
              className="p-3 rounded-full bg-gray-700 shadow-md hover:bg-gray-600 transition-colors "
            >
              {isMuted
                ? <MicOff className="text-red-500 w-6 h-6" />
                : <Mic className="text-white-300 w-6 h-6" />
              }
            </button>

            <button
              onClick={toggleCamera}
              className="p-3 rounded-full bg-gray-700 shadow-md hover:bg-gray-600 transition-colors"
            >
              {isCameraOn
                ? <Camera className="text-white-300 w-6 h-6" />
                : <CameraOff className="text-red-500 w-6 h-6" />
              }
            </button>

            <button
              onClick={toggleCall}
              className="p-3 rounded-full bg-gray-700 shadow-md hover:bg-gray-600 transition-colors "
            >
              {isCallActive
                ? <PhoneOff className="text-red-500 w-6 h-6" />
                : <Phone className="text-white-300 w-6 h-6" />
              }
            </button>

          </div>
        </div>

        {users.length > 0 && <RemoteUser user={users[0]} hasUserJoined={hasUserJoined} />}
      </div>


    </div>
  );
};

export default App;

