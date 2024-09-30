import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useContext,
} from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserContext } from '@/app/UserContext';
import {ActiveSpeakerAnimation} from "@/components/ui/ActivespeakerAudiowaves"

import { AI_AGENT_UID } from "@/utils/const"
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


export const Users: React.FC<{channel_name: string}> = () => {
   const {
    users, 
    localUserContainerRef, 
    isCameraOn, 
    maxVolumeUser, 
    localUserId, 
    toggleMute, 
    isMuted, 
    toggleCall, 
    isCallActive, 
    remoteUsersContainerRef,
    localTracks
    } = useContext(UserContext)

    return (
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
            <Userbadge text={'You'} />
            <ActiveSpeakerAnimation audioTrack={localTracks[0]} isMuted={isMuted} />
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
          <Userbadge text={users[0].uid == AI_AGENT_UID ? "OpenAI": users[0].uid} />
          {users[0]?.audioTrack && <ActiveSpeakerAnimation audioTrack={users[0]?.audioTrack} isMuted={false} />}
        </Card>
      </div>
    )}        
  </div>
  )
}
