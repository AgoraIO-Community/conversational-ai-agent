# Conversational AI Agent Frontend

This is the frontend for the Conversational AI Agent project, built with [Next.js](https://nextjs.org).

## Setup

1. Clone the repository and navigate to the frontend folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file by copying the `.env.example`:

```bash
cp .env.example .env
```

4. Open the `.env` file and fill in the required environment variables:

   - `NEXT_PUBLIC_AGORA_APP_ID`: Your Agora App ID
   - `NEXT_PUBLIC_AGORA_APP_CERTIFICATE`: Your Agora App Certificate
   - `NEXT_PUBLIC_AGORA_CHANNEL_NAME`: The channel name for Agora (default is 'realtimekit_agora')

## Running the Development Server

To start the development server, run:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Token Generation

This project leverages the front-end cloud functionality of Next.js to include built-in Agora token generation. The token generation process works as follows:

1. When a user needs to join a channel, the frontend makes a request to a serverless function (located in `app/api/token/route.ts`).
2. This front-end cloud function uses the [Agora Token Builder](https://www.npmjs.com/package/agora-token) to generate a token based on the app ID, app certificate, channel name, and user ID.
3. The generated token is then returned to the frontend, where it's used to initialize the Agora client and join the channel.

This approach allows for secure token generation without exposing sensitive credentials on the client side. Make sure to set the `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` environment variables in your `.env` file for this feature to work correctly.

## Project Structure

- `app/`: Contains the main application code
- `components/`: Reusable React components
- `styles/`: CSS and styling files
- `public/`: Static assets

## Additional Information

For more details on working with Next.js, refer to the [Next.js Documentation](https://nextjs.org/docs).
