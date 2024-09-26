'use client'
import React, { useEffect, useState, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
// import './App.css';

const App: React.FC = () => {
  const [users, setUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [localTracks, setLocalTracks] = useState<[IMicrophoneAudioTrack | null, ICameraVideoTrack | null]>([null, null]);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const [streamMessages, setStreamMessages] = useState<{ uid: string; message: string }[]>([]);


//   TODO - move to env
  const appId = process.env.AGORA_APP_ID
  const channelName = process.env.AGORA_CHANNEL;

  useEffect(() => {
    const init = async () => {
      clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      clientRef.current.on('user-published', async (user, mediaType) => {
        await clientRef.current!.subscribe(user, mediaType);
        if (mediaType === 'video') {
          setUsers((prevUsers) => [...prevUsers, user]);
        }
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      });

      clientRef.current.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          setUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid));
        }
        if (mediaType === 'audio') {
          user.audioTrack?.stop();
        }
      });

      clientRef.current.on("stream-message", (uid, payload) => {
        console.info(`received data stream message from ${uid}: `, payload, message);
        const message = new TextDecoder().decode(payload);
        // parse from string to json
        const parsedObject = JSON.parse(message);
        console.info(`parsedObject`, parsedObject);
        // {
        //     content: string, 
        //     msg_id: "item_ABfit3ZCce6gap7WbesMZ",
        //     part_idx: 0,
        //     total_parts: 1
        // }
        const parsedContent = JSON.parse(parsedObject.content);
        console.info(`parsed content`, parsedContent);

        // {content_index: 0,
        // delta: "You're",
        // event_id: "event_ABfiubmDZiLLsfUdgycfL",
        // item_id: "item_ABfit3ZCce6gap7WbesMZ",
        // output_index: 0,
        // response_id: "resp_ABfit0cKR2E4T5NpFIz8w",
        // type: "response.audio_transcript.delta"}

        setStreamMessages(prev => [...prev, { uid: uid.toString(), message }]);
     });

      const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalTracks([microphoneTrack, cameraTrack]);

      await clientRef.current.join(appId, channelName, null, null);
      await clientRef.current.publish([microphoneTrack, cameraTrack]);
    };

    init();

    return () => {
      clientRef.current?.leave();
      localTracks[0]?.close();
      localTracks[1]?.close();
    };
  }, []);

  return (
    <div className="App">
      <h1>Agora Video Call</h1>
      <p>Participants: {users.length + 1}</p>
      <div className="video-grid">
        <div className="video-container">
          <div className="video-player" ref={(ref) => ref && localTracks[1]?.play(ref)}></div>
          <p>Local User</p>
        </div>
        <div>
            {users.map((user) => (
            <div className="video-container" key={user.uid}>
                <div className="video-player" ref={(ref) => ref && user.videoTrack?.play(ref)}></div>
                <p>Remote User {user.uid}</p>
            </div>
            ))}
        </div>
      </div>
      <div className="stream-messages">
        <h2>Stream Messages</h2>
        {streamMessages.map((msg, index) => (
          <p key={index}>User {msg.uid}: {msg.message}</p>
        ))}
      </div>
    </div>
  );
};

export default App;