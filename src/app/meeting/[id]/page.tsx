"use client";
import { useEffect, useRef, useState } from "react";
import Peer, { MediaConnection } from "peerjs";
import io, { Socket } from "socket.io-client";

let socket: Socket;

export default function MeetingRoom({ params }: { params: { id: string } }) {
  const [peers, setPeers] = useState<{ [key: string]: MediaConnection }>({});
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenShare, setScreenShare] = useState<MediaStream | null>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [key: string]: MediaConnection }>({});
  const peerInstance = useRef<Peer | null>(null);

  useEffect(() => {
    socketInitializer();

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (userVideo.current) userVideo.current.srcObject = stream;

        const peer = new Peer();
        peerInstance.current = peer;

        peer.on("open", (id) => {
          socket.emit("join-room", params.id, id);
        });

        peer.on("call", (call: MediaConnection) => {
          call.answer(stream);
          call.on("stream", (userVideoStream: MediaStream) => {
            addVideoStream(call.peer, userVideoStream);
          });
        });

        socket.on("user-connected", (userId: string) => {
          connectToNewUser(userId, stream);
        });
      });

    return () => {
      cleanup();
    };
  }, [params.id]);

  const socketInitializer = async () => {
    await fetch("/api/socket");
    socket = io("/", {
      path: "/api/socket",
    });

    socket.on("user-disconnected", (userId: string) => {
      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
        setPeers((prev) => {
          const newPeers = { ...prev };
          delete newPeers[userId];
          return newPeers;
        });
        const videoElement = document.getElementById(`video-${userId}`);
        if (videoElement) videoElement.remove();
      }
    });
  };

  function connectToNewUser(userId: string, stream: MediaStream) {
    if (!peerInstance.current) return;
    const call = peerInstance.current.call(userId, stream);
    call.on("stream", (userVideoStream: MediaStream) => {
      addVideoStream(userId, userVideoStream);
    });
    call.on("close", () => {
      const videoElement = document.getElementById(`video-${userId}`);
      if (videoElement) videoElement.remove();
    });

    peersRef.current[userId] = call;
    setPeers((prev) => ({ ...prev, [userId]: call }));
  }

  function addVideoStream(userId: string, stream: MediaStream) {
    const existingVideo = document.getElementById(`video-${userId}`);
    if (existingVideo) return; // 이미 존재하는 비디오는 추가하지 않음

    const video = document.createElement("video");
    video.srcObject = stream;
    video.id = `video-${userId}`;
    video.autoplay = true;
    video.playsInline = true;
    video.className = "w-full h-full object-cover rounded-lg";
    const videoContainer = document.createElement("div");
    videoContainer.className = "relative";
    videoContainer.appendChild(video);
    document.getElementById("video-grid")?.appendChild(videoContainer);
  }

  const handleEndCall = () => {
    cleanup();
    // 여기에 통화 종료 후 리다이렉트 로직을 추가할 수 있습니다.
    // 예: router.push('/');
  };

  const cleanup = () => {
    if (socket) socket.disconnect();
    if (stream) stream.getTracks().forEach((track) => track.stop());
    if (screenShare) screenShare.getTracks().forEach((track) => track.stop());
    if (peerInstance.current) peerInstance.current.destroy();
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!screenShare) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        setScreenShare(screenStream);
        if (userVideo.current) userVideo.current.srcObject = screenStream;
        Object.values(peersRef.current).forEach((call) => {
          call.peerConnection.getSenders().forEach((sender) => {
            if (sender.track?.kind === "video") {
              sender.replaceTrack(screenStream.getVideoTracks()[0]);
            }
          });
        });
      } catch (error) {
        console.error("Error sharing screen:", error);
      }
    } else {
      screenShare.getTracks().forEach((track) => track.stop());
      setScreenShare(null);
      if (stream && userVideo.current) userVideo.current.srcObject = stream;
      Object.values(peersRef.current).forEach((call) => {
        call.peerConnection.getSenders().forEach((sender) => {
          if (sender.track?.kind === "video" && stream) {
            sender.replaceTrack(stream.getVideoTracks()[0]);
          }
        });
      });
    }
  };

  return (
    <div className="min-h-screen bg-white text-black p-8">
      <h1 className="text-3xl font-bold mb-4">Meeting Room: {params.id}</h1>
      <div
        id="video-grid"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div className="relative">
          <video
            ref={userVideo}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover rounded-lg"
          />
          <p className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
            You
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-center space-x-4">
        <button
          onClick={toggleAudio}
          className={`${
            audioEnabled ? "bg-blue-500" : "bg-red-500"
          } hover:opacity-80 text-white font-bold py-2 px-4 rounded`}
        >
          {audioEnabled ? "Mute" : "Unmute"}
        </button>
        <button
          onClick={toggleVideo}
          className={`${
            videoEnabled ? "bg-blue-500" : "bg-red-500"
          } hover:opacity-80 text-white font-bold py-2 px-4 rounded`}
        >
          {videoEnabled ? "Turn Off Video" : "Turn On Video"}
        </button>
        <button
          onClick={toggleScreenShare}
          className={`${
            screenShare ? "bg-green-500" : "bg-blue-500"
          } hover:opacity-80 text-white font-bold py-2 px-4 rounded`}
        >
          {screenShare ? "Stop Sharing" : "Share Screen"}
        </button>
        <button
          onClick={handleEndCall}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          End Call
        </button>
      </div>
    </div>
  );
}
