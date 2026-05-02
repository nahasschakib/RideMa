"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import Image from "next/image";
import {
  AlertTriangle,
  CheckCircle,
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  X,
  XCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { AnimatePresence, motion } from "motion/react";

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (
      domain: string,
      options: Record<string, unknown>
    ) => {
      dispose: () => void;
      executeCommand: (command: string, ...args: unknown[]) => void;
      addEventListeners: (listeners: Record<string, () => void>) => void;
    };
  }
}

export default function VideoKycComponent() {
  const { userData } = useSelector((state: RootState) => state.user);
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiRef = useRef<InstanceType<typeof window.JitsiMeetExternalAPI> | null>(null);
  const hasJoined = useRef(false);
  const router = useRouter()
  const [joined, setJoined] = useState(false);
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const { roomId } = useParams();
  const [loading, setLoading] = useState(false);
  const [mediaError, setMediaError] = useState<{
    type: "denied" | "notfound" | "unknown";
    message: string;
  } | null>(null);

  const [reason, setReason] = useState("");
  const [aLoading, setALoading] = useState(false);
  const [rLoading, setRLoading] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [jitsiReady, setJitsiReady] = useState(false);

// ── Load Jitsi script once ────────────────────────────────────────────────
  useEffect(() => {
    if (window.JitsiMeetExternalAPI) { setJitsiReady(true); return; }
    if (document.getElementById("jitsi-api-script")) return;
    const script = document.createElement("script");
    script.id = "jitsi-api-script";
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => setJitsiReady(true);
    document.body.appendChild(script);
    return () => {
      document.getElementById("jitsi-api-script")?.remove();
    };
  }, []);


  // ── Media init ────────────────────────────────────────────────────────────
  useEffect(() => {
    let localStream: MediaStream | null = null;

    const init = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setMediaError(null);
        streamRef.current = localStream;
        setStream(localStream);

        if (previewRef.current) {
          previewRef.current.srcObject = localStream;
        }
      } catch (error) {
        if (error instanceof DOMException) {
          if (
            error.name === "NotAllowedError" ||
            error.name === "PermissionDeniedError"
          ) {
            setMediaError({
              type: "denied",
              message:
                "Camera and microphone access was denied. Please allow access in your browser settings and reload the page.",
            });
          } else if (
            error.name === "NotFoundError" ||
            error.name === "DevicesNotFoundError"
          ) {
            setMediaError({
              type: "notfound",
              message:
                "No camera or microphone was found. Please connect a device and reload the page.",
            });
          } else {
            setMediaError({ type: "unknown", message: error.message });
          }
        } else {
          setMediaError({
            type: "unknown",
            message:
              "An unexpected error occurred while accessing your media devices.",
          });
        }
        console.error("Media error:", error);
      }
    };

    init();

    return () => {
      // Use closure variable, not stale state, to stop tracks
      localStream?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Zego cleanup on unmount ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      jitsiRef.current?.dispose();
      jitsiRef.current = null;
      hasJoined.current = false;
    };
  }, []);

  // ── Toggles ───────────────────────────────────────────────────────────────
  const toggleCamera = () => {
    if (!stream) return;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !isCameraOn;
    });
    setIsCameraOn((prev) => !prev);
  };

  const toggleMic = () => {
    if (!stream) return;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !isMicOn;
    });
    setIsMicOn((prev) => !prev);
  };

  // ── KYC actions ───────────────────────────────────────────────────────────
  // handleReject was previously nested INSIDE handleApprove due to a missing
  // closing brace — both are now correctly defined at the same scope level.

  const handleApprove = async () => {
    setALoading(true);
    try {
      const { data } = await axios.post("/api/admin/video-kyc/complete", {
        roomId,
        action: "approved",
      });
      console.log(data);
      
      router.push("/")
      setShowApprovalModal(false);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error(error?.response?.data?.message ?? error.message);
      } else if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error("Unknown error occurred");
      }
    } finally {
      // Reset loading in finally — previously only set in catch, so a
      // successful response left the button stuck in "Processing..." forever.
      setALoading(false);
    }
  };

  const handleReject = async () => {
    setRLoading(true);
    try {
      const { data } = await axios.post("/api/admin/video-kyc/complete", {
        roomId,
        action: "rejected",
        reason,
      });
      console.log(data);
     
      router.push("/")
      setShowRejectionModal(false);
      setReason("");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error(error.response?.data?.message ?? error.message);
      } else if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error("Unknown error occurred");
      }
    } finally {
      setRLoading(false);
    }
  };

  // ── Call setup ────────────────────────────────────────────────────────────
  const startCall = async () => {
    if (!containerRef.current || !userData || hasJoined.current) return;

    const resolvedRoomId = Array.isArray(roomId) ? roomId[0] : roomId;
    if (!resolvedRoomId) {
      console.error("Missing roomId");
      return;
    }
 
    if (!window.JitsiMeetExternalAPI) {
      console.error("Jitsi script not loaded yet — please retry in a moment");
      return;
    }

    setLoading(true);
    hasJoined.current = true;

    // Stop the local preview stream and wait for the OS to release the device
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const displayName =
      userData.role === "admin"
        ? "Admin"
        : `${userData.name}(${userData.email})`;

    try {
      // Sanitise the room name: Jitsi requires no spaces or special characters
      const roomName = `kyc-${resolvedRoomId.replace(/[^a-zA-Z0-9]/g, "")}`;
 
      jitsiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName,
        parentNode: containerRef.current,
        userInfo: { displayName },
        configOverwrite: {
          startWithAudioMuted: !isMicOn,
          startWithVideoMuted: !isCameraOn,
          // Disable the Jitsi pre-join screen — we have our own
          prejoinPageEnabled: false,
          // Disable features irrelevant to a KYC 1-on-1 call
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_BUTTONS: [
            "microphone", "camera", "fullscreen",
            "fodeviceselection", "hangup", "chat",
          ],
        },
      });
 
      // Sync our "joined" state if the user hangs up from inside Jitsi
      jitsiRef.current.addEventListeners({
        readyToClose: () => endCall(),
      });

      setJoined(true);
    } catch (error) {
      console.error("Error starting call:", error);
      hasJoined.current = false;
    } finally {
      setLoading(false);
    }
  };

  const endCall = () => {
    jitsiRef.current?.dispose();
    jitsiRef.current = null;
    hasJoined.current = false;
    setJoined(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Image src="/logo1.png" alt="logo" width={50} height={50} priority />
          <p>
            {userData?.role === "admin" ? "Admin Verification" : "Partner Video KYC"}
          </p>
        </div>
        {joined && (
          <div className="flex flex-wrap gap-3">
            {userData?.role === "admin" && (
              <>
                <button
                  onClick={() => setShowApprovalModal(true)}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-full text-sm flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectionModal(true)}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full text-sm flex items-center gap-2"
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </>
            )}
            <button
              onClick={endCall}
              className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded-full text-sm flex items-center gap-2"
            >
              <PhoneOff size={16} />
              End Call
            </button>
          </div>
        )}
      </div>

      {/* Call area */}
      <div className="flex-1 relative">
        <div
          ref={containerRef}
          className={`absolute inset-0 ${joined ? "block" : "hidden"}`}
        />
        {!joined && (
          <div className="w-full flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Preview or permission error banner */}
              {mediaError ? (
                <div className="relative rounded-2xl border border-red-500/40 bg-red-500/10 h-[300px] sm:h-[400px] flex flex-col items-center justify-center gap-4 px-6 text-center">
                  <AlertTriangle size={40} className="text-red-400" />
                  <p className="text-sm text-red-300 leading-relaxed">
                    {mediaError.message}
                  </p>
                  {mediaError.type === "denied" && (
                    <p className="text-xs text-white/40">
                      Click the camera icon in your browser&apos;s address bar
                      to update permissions.
                    </p>
                  )}
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                  <video
                    ref={previewRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-[300px] sm:h-[400px] object-cover"
                  />
                  {!isCameraOn && (
                    <div className="absolute inset-0 bg-black flex items-center justify-center">
                      <VideoOff size={40} />
                    </div>
                  )}
                </div>
              )}

              {/* Controls */}
              <div className="space-y-8 text-center lg:text-left">
                <h1 className="text-3xl sm:text-4xl font-bold">
                  Secure Video KYC
                </h1>
                <div className="flex justify-center lg:justify-start gap-6">
                  <button
                    onClick={toggleCamera}
                    disabled={!!mediaError}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed ${
                      isCameraOn
                        ? "bg-white text-black"
                        : "bg-white/10 border border-white/20"
                    }`}
                  >
                    {isCameraOn ? <Video /> : <VideoOff />}
                  </button>
                  <button
                    onClick={toggleMic}
                    disabled={!!mediaError}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed ${
                      isMicOn
                        ? "bg-white text-black"
                        : "bg-white/10 border border-white/20"
                    }`}
                  >
                    {isMicOn ? <Mic /> : <MicOff />}
                  </button>
                </div>
                <button
                  onClick={startCall}
                  disabled={loading || !!mediaError || !jitsiReady}
                  className="w-full bg-white text-black py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? "Connecting..."
                    : mediaError
                    ? "Camera / Mic Access Required"
                    : !jitsiReady
                    ? "Loading..."
                    : "Join Secure Call"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Approval modal */}
      <AnimatePresence>
        {showApprovalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative bg-[#111] w-full max-w-md rounded-2xl p-6 shadow-2xl"
            >
              <button
                onClick={() => setShowApprovalModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
              <h2 className="text-lg font-semibold mb-4">Confirm Approval</h2>
              <p className="text-sm text-white/60 mb-6">
                Are you sure you want to approve this KYC submission?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 border border-white/20 rounded-xl py-2 text-sm hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={aLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl py-2 text-sm disabled:opacity-50"
                >
                  {aLoading ? "Processing..." : "Approved"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rejection modal */}
      <AnimatePresence>
        {showRejectionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative bg-[#111] w-full max-w-md rounded-2xl p-6 shadow-2xl"
            >
              <button
                onClick={() => setShowRejectionModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
              <h2 className="text-lg font-semibold mb-4">Confirm Rejection</h2>
              <p className="text-sm text-white/60 mb-3">
                Please provide a reason for rejecting this KYC submission.
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Enter rejection reason..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-white/30 mb-6"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="flex-1 border border-white/20 rounded-xl py-2 text-sm hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={rLoading || !reason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rLoading ? "Processing..." : "Reject"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}