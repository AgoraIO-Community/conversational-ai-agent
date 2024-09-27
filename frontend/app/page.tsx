'use client';
import AgoraLogo from './logo-agora.png';
import Image from 'next/image';
import { useContext, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AppRootContext } from './AppRootContext';

export default function LandingPage() {
  const contextValues = useContext(AppRootContext);
  const { appId, channelId, localUserId, setChannelId, token, setToken } =
    contextValues;

  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if(appId && channelId){
      fetchToken();
    }
  }, [appId, channelId]);

  const fetchToken = async () => {
    if (localUserId === '') return;
    try {
      const response = await fetch(
        `/api/token?channelName=${channelId}&uid=${localUserId}`
      );
      const data = await response.json();
      if (data.token) {
        setToken(data.token);
      } else {
        throw new Error('Failed to get token');
      }
    } catch (error) {
      console.error(error);
      setError(true);
    }
  };

  const join = () => {
    if (localUserId === '') {
      setError(true);
      return;
    }
    if (error) {
      setError(false);
    }
    router.push('/agora/' + channelId);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          className="self-center"
          src={AgoraLogo}
          alt="Agora logo"
          width={180}
          height={38}
          priority
        />
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Unable to connect... check your App ID, and App Certificate values
              are set in the .env file
            </AlertDescription>
          </Alert>
        ) : null}
        <Card className="columns-xl">
          <CardHeader>
            <CardTitle>Agora Conversational AI</CardTitle>
          </CardHeader>
          <CardContent>
            {/* <Input
              className="p-5 mb-5"
              type="text"
              placeholder="APP ID"
              value={appId}
              readOnly
            /> */}
            <label
              htmlFor="channelId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Channel Name
            </label>
            <Input
              className="p-5 mb-5"
              type="text"
              placeholder="Channel ID"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              // readOnly
            />
            {/* <Input
              className="p-5 mb-5"
              type="text"
              placeholder="User ID"
              value={localUserId}
              onChange={(e) => serLocalUserId(e.target.value)}
            /> 
            <Input
              className="p-5 mb-5"
              type="text"
              placeholder="Token"
              value={token}
              readOnly
            /> */}
          </CardContent>
          <CardFooter className="justify-center">
            <Button className="w-full" onClick={join}>
              Join
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
