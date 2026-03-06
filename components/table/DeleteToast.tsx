"use client";

import { useState } from "react";

type Props = {
  selectedCount: number;
  onDelete: () => Promise<void>;
  onDismiss: () => void;
};

export default function DeleteToast({ selectedCount, onDelete, onDismiss }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onDelete();
    setLoading(false);
    onDismiss();
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#1a1a1e] border border-[#2a2a2e] px-5 py-3 shadow-xl font-mono">
      {!confirming ? (
        <>
          <span className="text-[10px] text-[#c0bbb4] tabular-nums">
            <span className="text-[#e8e4dc]">{selectedCount}건</span> 선택됨
          </span>
          <div className="w-px h-3 bg-[#2a2a2e]" />
          <button
            onClick={onDismiss}
            className="text-[10px] text-[#444] hover:text-[#666] tracking-widest uppercase transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => setConfirming(true)}
            className="text-[10px] text-red-400 hover:text-red-300 tracking-widest uppercase transition-colors"
          >
            삭제
          </button>
        </>
      ) : (
        <>
          <span className="text-[10px] text-[#c0bbb4]">
            <span className="text-red-400">{selectedCount}건</span>을 삭제할까요?
          </span>
          <div className="w-px h-3 bg-[#2a2a2e]" />
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="text-[10px] text-[#444] hover:text-[#666] tracking-widest uppercase transition-colors disabled:opacity-40"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="text-[10px] text-red-400 hover:text-red-300 tracking-widest uppercase transition-colors disabled:opacity-40"
          >
            {loading ? "삭제 중..." : "확인"}
          </button>
        </>
      )}
    </div>
  );
}