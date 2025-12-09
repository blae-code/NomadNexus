# Riggsy - Nomad Nexus Voice Agent

This directory will contain the source code and configuration for **Riggsy**, the AI voice agent for Nomad Nexus.

## Overview

Riggsy is built on the [LiveKit Agents Framework](https://docs.livekit.io/agents/). It joins LiveKit rooms as a headless participant, capable of understanding user voice commands, responding with synthesized speech, and interacting with the Nomad Nexus platform through the tactical data channel.

## Development Template

The agent is based on the official [LiveKit `agent-starter-node`](https://github.com/livekit/agent-starter-node) template. This provides the core scaffolding for:
- Connecting to a LiveKit room.
- Handling incoming audio streams.
- Processing speech-to-text (STT).
- Generating text responses (e.g., via a local LLM or a cloud service like OpenAI).
- Synthesizing text-to-speech (TTS).
- Publishing an outbound audio stream.

## Agent-Client Contract

Communication between the Nomad Nexus client and the Riggsy agent occurs over the LiveKit reliable data channel, using the `TacticalTransceiver` API.

- **Client to Agent**: `RIGGSY_QUERY`
  - Sent when a user issues a voice command or a slash command (e.g., `/riggsy route power to shields`).
  - The payload contains the user's textual query.

- **Agent to Client**: `RIGGSY_RESPONSE`
  - Sent by the agent after processing a query.
  - The payload contains a textual response. The client is responsible for rendering this in the UI (e.g., Data Slate) and/or speaking it aloud using the local `ShipVoice` TTS engine.

## Getting Started (Future)

1.  Navigate to the `agents/riggsy-agent` directory.
2.  Run `npm install`.
3.  Configure the environment variables in a `.env` file (e.g., `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `OPENAI_API_KEY`).
4.  Run `npm start` to launch the agent.

The agent will automatically attempt to join rooms that match the convention used by the Nomad Nexus application.
