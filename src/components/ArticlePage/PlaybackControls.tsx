import React from "react";
import { PauseIcon, PlayIcon } from "@/components/Icons";

interface PlaybackControlsProps {
  isPlaying: boolean;
  togglePlayback: () => void;
  voicesLoaded: boolean;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  togglePlayback,
  voicesLoaded,
}) => {
  if (!voicesLoaded) return null;
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={togglePlayback}
        className="cursor-pointer flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
      >
        {isPlaying ? (
          <>
            <PauseIcon className="w-5 h-5" />
            Pause
          </>
        ) : (
          <>
            <PlayIcon className="w-5 h-5" />
            Play
          </>
        )}
      </button>
      {/*<span className="text-sm text-gray-600">
                Lang: {article.language.toUpperCase()}
              </span>*/}
    </div>
  );
};
