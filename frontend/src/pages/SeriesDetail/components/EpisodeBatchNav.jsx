import React from 'react';

const EpisodeBatchNav = ({ currentBatch, totalBatches, onBatchChange, episodesPerBatch }) => {
  if (totalBatches <= 1) {
    return null; // Don't show navigation if only 1 batch
  }

  const getBatchLabel = (batchNumber) => {
    const startEpisode = (batchNumber - 1) * episodesPerBatch + 1;
    const endEpisode = Math.min(batchNumber * episodesPerBatch, totalBatches * episodesPerBatch);
    return `${startEpisode}-${endEpisode}`;
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Previous Button */}
      <button
        onClick={() => onBatchChange(currentBatch - 1)}
        disabled={currentBatch === 1}
        className={`p-1.5 rounded transition-colors ${
          currentBatch === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Batch Buttons - Compact */}
      <div className="flex items-center space-x-1">
        {Array.from({ length: totalBatches }, (_, i) => i + 1).map((batchNumber) => (
          <button
            key={batchNumber}
            onClick={() => onBatchChange(batchNumber)}
            className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-all ${
              currentBatch === batchNumber
                ? 'bg-gradient-to-r from-[#34D0F4] to-[#4DD9FF] text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            {getBatchLabel(batchNumber)}
          </button>
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onBatchChange(currentBatch + 1)}
        disabled={currentBatch === totalBatches}
        className={`p-1.5 rounded transition-colors ${
          currentBatch === totalBatches
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default EpisodeBatchNav;
