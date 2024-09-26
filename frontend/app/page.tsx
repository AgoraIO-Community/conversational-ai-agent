"use client";
import AgoraLogo from "./logo-agora.png";
import Image from "next/image";
import { useContext, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppRootContext } from "./AppRootContext";

export default function LandingPage() {
  //state variable
  const { appId, setAppId, channelId, setChannelId, userId, setUserId } =
    useContext(AppRootContext);
  console.log({appId}, {channelId})
  const [error, setError] = useState(false);

  //routing
  const router = useRouter();

  //onclick for join button
  const join = () => {
    if (appId === "" || channelId === "" || userId === "") {
      setError(true);
      return;
    }
    if (error) {
      setError(false);
    }
    try {
      //navigate to call screen
      router.push("/agora/" + channelId);
    } catch (error) {
      console.error(error);
    }
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
              Please enter all the input values
            </AlertDescription>
          </Alert>
        ) : (
          <></>
        )}
        <Card className="columns-xl">
          <CardHeader>
            <CardTitle>Agora Conversational AI</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              className="p-5 mb-5"
              type="text"
              placeholder="APP ID"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
            />
            <Input
              className="p-5 mb-5"
              type="text"
              placeholder="Channel ID"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
            />
            <Input
              className="p-5 mb-5"
              type="text"
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </CardContent>
          <CardFooter className="justify-center">
            <Button onClick={() => join()}>Join</Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
