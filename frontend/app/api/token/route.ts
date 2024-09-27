import { NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channelName =
    searchParams.get('channelName') ||
    process.env.NEXT_PUBLIC_AGORA_CHANNEL_NAME;
  const uid = searchParams.get('uid') || '0';

  if (!channelName) {
    return NextResponse.json(
      { error: 'Channel name is required and no default is set' },
      { status: 400 }
    );
  }

  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.NEXT_PUBLIC_AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    return NextResponse.json(
      { error: 'Agora credentials are not properly configured' },
      { status: 500 }
    );
  }

  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    parseInt(uid),
    role,
    privilegeExpiredTs,
    privilegeExpiredTs
  );

  return NextResponse.json({ token, channelName, appId });
}
