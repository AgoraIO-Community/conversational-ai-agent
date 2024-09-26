'use client'
import React, { useEffect, useState, useRef, useCallback, useContext } from 'react';
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { AppRootContext } from "../../AppRootContext";
import { Badge } from "@/components/ui/badge"
import { redirect } from 'next/navigation'
import { Mic, MicOff, Camera, CameraOff, Phone, PhoneOff } from 'lucide-react';


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
    <div
      ref={containerRef}
      className='w-[400px] aspect-video border border-solid border-gray-300 rounded-lg overflow-hidden relative'
      id={`remote-user-${user.uid}`}
    >
      <Badge variant="outline" className="absolute bottom-1 right-2 z-[3] bg-gray-500 text-white">{user.uid}</Badge>
    </div>
  );
};


// import './App.css';

const App: React.FC = () => {
  const { appId: appID, channelId, userId } = useContext(AppRootContext);
  useEffect(() => {
    console.log("debugging a", channelId, appID, userId);
  }, [channelId, appID, userId]);

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

  if (!appID || !channelId || !userId) {
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

  const toggleCall = useCallback(() => {
    setIsCallActive(!isCallActive);
    window.location.reload();
  }, [isCallActive]);

  const handleUserJoined = useCallback((user: IAgoraRTCRemoteUser) => {
    console.log("user joined", user);
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

    await clientRef.current.subscribe(user, mediaType);

    if (mediaType === "video" && user.videoTrack) {
      console.log("subscribe video success");
      if (remoteUsersContainerRef.current) {
        setHasUserJoined(true);
      } else {
        console.error("Remote users container not found");
      }
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
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    client.on("user-joined", handleUserJoined);
    client.on("user-left", handleUserLeft);
    client.on("user-published", handleUserPublished);
    client.on("stream-message", handleStreamMessage);

    const init = async () => {
      try {
        const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        setLocalTracks([microphoneTrack, cameraTrack]);

        if (localUserContainerRef.current && cameraTrack) {
          cameraTrack.play(localUserContainerRef.current, { fit: 'cover' });
        }
        await client.join(appID, channelId, null, null);
        console.log('Joined channel successfully');

        await client.publish([microphoneTrack, cameraTrack]);
        console.log('Tracks published successfully');
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
  }, [handleUserJoined, handleUserLeft, handleUserPublished, handleStreamMessage, appID, channelId]);

  return (
    <div className="App">
      <h1>Agora Video Call</h1>
      <p>Participants: {users.length + 1}</p>
      <div className="flex flex-row justify-center items-center gap-5">
        <div>
          <span className="text-center block">Local User</span>
          <div
            ref={localUserContainerRef}
            className="w-[400px] aspect-video border border-solid border-gray-300 rounded-lg overflow-hidden relative"
            id="localUser"
          ></div>
        </div>
        <div>
          <span className="text-center block">Remote User</span>
          <div
            ref={remoteUsersContainerRef}
            className="w-[400px] aspect-video border border-solid border-gray-300 rounded-lg overflow-hidden relative"
            id="remoteUser"
          >
            {users.length > 0 && <RemoteUser user={users[0]} hasUserJoined={hasUserJoined} />}
          </div>
        </div>
      </div>

      <div className="stream-messages">
        <h2>Stream Messages</h2>
        {streamMessages.map((msg, index) => (
          <p key={index}>
            User {msg.uid}: {msg.message}
          </p>
        ))}
      </div>
      <div className="mt-auto w-full bg-gray-800 py-4 border-t border-gray-700 ">
        <div className="flex justify-center items-center gap-2">
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
    </div>
  );
};

export default App;
