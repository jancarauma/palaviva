// components/ModalOverlay.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ReactNode } from "react";

interface ModalOverlayProps {
  children?: ReactNode;
  isVisible: boolean;
  onClose: () => void;
  overlayClassName?: string;
}

export const ModalOverlay = ({
  isVisible,
  onClose,
  overlayClassName = "fixed inset-0 bg-black/30 dark:bg-black/50 z-40",
}: ModalOverlayProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="presentation"
          className={overlayClassName}
          onClick={onClose}
        />
      )}
    </AnimatePresence>
  );
};