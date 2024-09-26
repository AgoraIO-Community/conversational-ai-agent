"use client";
import React, { useEffect, useState, useRef, useContext } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import { useParams } from "next/navigation";
import { AppRootContext } from "../../AppRootContext";

// import './App.css';

const App: React.FC = () => {
  // const { channel } = useParams();
  const { appId, channelId, userId } = useContext(AppRootContext);
  useEffect(() => {
    console.log("debugging a", channelId, appId, userId);
  }, [channelId, appId, userId]);
  const [users, setUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [localTracks, setLocalTracks] = useState<
    [IMicrophoneAudioTrack | null, ICameraVideoTrack | null]
  >([null, null]);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const [streamMessages, setStreamMessages] = useState<
    { uid: string; message: string }[]
  >([]);

  // //   TODO - move to env
  // const appId = process.env.AGORA_APP_ID;
  const channelName = channelId;

  useEffect(() => {
    const init = async () => {
      clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

      clientRef.current.on("user-published", async (user: IAgoraRTCRemoteUser, mediaType: "audio"| "video") => {
        await clientRef.current!.subscribe(user, mediaType);
        if (mediaType === "video") {
          setUsers((prevUsers) => [...prevUsers, user]);
        }
        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      });

      clientRef.current.on("user-unpublished", (user: IAgoraRTCRemoteUser, mediaType: string) => {
        if (mediaType === "video") {
          setUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid));
        }
        if (mediaType === "audio") {
          user.audioTrack?.stop();
        }
      });

      clientRef.current.on("stream-message", (uid: string, payload: Uint8Array) => {
        const message = new TextDecoder().decode(payload);
        console.info(
          `received data stream message from ${uid}: `,
          payload,
          message,
        );
        const parsedObject = JSON.parse(message);
        console.info(`parsedObject`, parsedObject);
        const parsedContent = JSON.parse(parsedObject.content);
        console.info(`parsed content`, parsedContent);

        setStreamMessages((prev) => [
          ...prev,
          { uid: uid.toString(), message },
        ]);
      });

      const [microphoneTrack, cameraTrack] =
        await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalTracks([microphoneTrack, cameraTrack]);

      if (appId && channelName) {
        await clientRef.current.join(appId, channelName, null, null);
        await clientRef.current.publish([microphoneTrack, cameraTrack]);
      }
    };

    init();

    return () => {
      clientRef.current?.leave();
      localTracks.forEach(track => track?.close()); // Close all tracks
    };
  }, [appId, channelName]); // Added dependencies

  return (
    <div className="App">
      <h1>Agora Video Call</h1>
      <p>Participants: {users.length + 1}</p>
      <div className="video-grid">
        <div className="video-container">
          <div
            className="video-player"
            ref={(ref) => {
              if(ref){
                ref && localTracks[1]?.play(ref)
              }
            }}
          ></div>
          <p>Local User</p>
        </div>
        <div>
          {users.map((user) => (
            <div className="video-container" key={user.uid}>
              <div
                className="video-player"
                ref={(ref) => {
                  if(ref){
                    ref && user.videoTrack?.play(ref)
                  }
                }}
              ></div>
              <p>Remote User {user.uid}</p>
            </div>
          ))}
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
    </div>
  );
};

export default App;
