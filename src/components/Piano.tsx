"use client";

import React, { useState, useEffect, useRef } from "react";

const NOTES = [
  { note: "C", key: "A", freq: 261.63 },
  { note: "D", key: "S", freq: 293.66 },
  { note: "E", key: "D", freq: 329.63 },
  { note: "F", key: "F", freq: 349.23 },
  { note: "G", key: "G", freq: 392.0 },
  { note: "A", key: "H", freq: 440.0 },
  { note: "B", key: "J", freq: 493.88 },
  { note: "C2", key: "K", freq: 523.25 },
];

export default function Piano() {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    audioContextRef.current = new AudioContext();

    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const note = NOTES.find(
        (n) => n.key.toLowerCase() === e.key.toLowerCase()
      );
      if (note) {
        playNote(note.freq);
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      stopNote();
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  function playNote(freq: number) {
    if (!audioContextRef.current) return;
    const audioCtx = audioContextRef.current;
    const oscillator = audioCtx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    oscillatorRef.current = oscillator;
  }

  function stopNote() {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
  }

  async function startRecording() {
    if (!navigator.mediaDevices) {
      alert("Media Devices API not supported.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setAudioChunks([]);
      recorder.start();

      recorder.ondataavailable = (e) => {
        setAudioChunks((prev) => [...prev, e.data]);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      setRecording(true);

      // Stop recording automatically after 30 seconds
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          setRecording(false);
        }
      }, 30000);
    } catch (err) {
      alert("Error accessing microphone: " + err);
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setRecording(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Piano Key App</h1>
      <div className="flex justify-center space-x-2 mb-6">
        {NOTES.map(({ note, key }) => (
          <button
            key={note}
            onMouseDown={() => playNote(NOTES.find((n) => n.note === note)!.freq)}
            onMouseUp={stopNote}
            onMouseLeave={stopNote}
            className="w-12 h-48 bg-white border border-gray-400 rounded shadow active:bg-gray-200 focus:outline-none"
            title={`Note: ${note}, Key: ${key}`}
          >
            <div className="text-center mt-36 text-black font-semibold">{key}</div>
          </button>
        ))}
      </div>
      <div className="flex justify-center space-x-4">
        {!recording ? (
          <button
            onClick={startRecording}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Stop Recording
          </button>
        )}
        {audioUrl && (
          <a
            href={audioUrl}
            download="recording.webm"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Save Recording
          </a>
        )}
      </div>
    </div>
  );
}
