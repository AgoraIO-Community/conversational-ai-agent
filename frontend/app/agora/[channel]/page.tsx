'use client'
import React, { useEffect, useState, useRef, useCallback, useContext } from 'react';
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { AppRootContext } from "../../AppRootContext";
import { Badge } from "@/components/ui/badge"
import { redirect } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Mic, MicOff, Camera, CameraOff, Phone, PhoneOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"



const AvatarUser = () => {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback></AvatarFallback>
    </Avatar>
  );
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
      <Badge variant="outline" className="absolute bottom-1 right-2 z-[3] bg-gray-500 text-white">{user.uid}</Badge>
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

  if (!appID || !channelId) {
    redirect('/');
  }

  const toggleMute = useCallback(() => {
    if (localTracks[0]) {
      if (isMuted) {
        localTracks[0].setEnabled(false);
      } else {
        localTracks[0].setEnabled(true);
      }
      setIsMuted(!isMuted);
    }
  }, [localTracks, isMuted]);

  const toggleCamera = useCallback(() => {
    if (localTracks[1]) {
      if (isCameraOn) {
        localTracks[1].setEnabled(false);
      } else {
        localTracks[1].setEnabled(true);
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
    window.location.reload();
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
    setStreamMessages(prev => [...prev, { uid: uid.toString(), message }]);
  }, []);



  useEffect(() => {
    if (isLocalUserJoined.current) return
    console.log({ isLocalUserJoined: isLocalUserJoined.current }, 'user')
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
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
    <div className="App h-screen">
      <h1>Agora Video Call</h1>
      <p>Participants: {users.length + 1}</p>
      <div className={`grid gap-10 ${
          users.length ? "grid-cols-2" : "grid-cols-1"
        } justify-center m-10 h-1/2`}>
          <Card
            ref={localUserContainerRef}
            className={`h-full ${users.length ? 'w-full' : 'w-[600px] m-auto'} aspect-video border border-solid border-gray-300 rounded-lg overflow-hidden relative`}
            id="localUser"
          >
             {!isCameraOn && <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center"><AvatarUser /></div>}
          </Card>
          {users.length > 0 && <RemoteUser user={users[0]} hasUserJoined={hasUserJoined} />}
      </div>

      <div className="stream-messages">
        <h2>Stream Messages</h2>
        {streamMessages.map((msg, index) => (
          <p key={index}>
            User {msg.uid}: {msg.message}
          </p>
        ))}
      </div>
      <div className="mt-auto absolute bottom-2 left-0 right-0 flex w-[200px] bg-gray-800 py-2 border-t border-gray-700 mx-auto justify-center items-center gap-4 rounded-[4px]">

        <button
          onClick={toggleMute}
          className="p-3 rounded-full bg-gray-700 shadow-md hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isMuted
            ? <MicOff className="text-red-500 w-6 h-6" />
            : <Mic className="text-green-500 w-6 h-6" />
          }
        </button>

        <button
          onClick={toggleCamera}
          className="p-3 rounded-full bg-gray-700 shadow-md hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isCameraOn
            ? <Camera className="text-green-500 w-6 h-6" />
            : <CameraOff className="text-red-500 w-6 h-6" />
          }
        </button>

        <button
          onClick={toggleCall}
          className="p-3 rounded-full bg-gray-700 shadow-md hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isCallActive
            ? <PhoneOff className="text-red-500 w-6 h-6" />
            : <Phone className="text-green-500 w-6 h-6" />
          }
        </button>

      </div>

    </div>
  );
};

export default App;
