import React, { createContext, useContext, useState, useCallback } from "react";
import PromptConfirm from "./PromptConfirm";

const PromptContext = createContext();

export const usePrompt = () => useContext(PromptContext);

export const PromptProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [callbacks, setCallbacks] = useState({ onConfirm: null, onCancel: null });

  const confirm = useCallback((msg, onConfirm, onCancel = () => {}) => {
    setMessage(msg);
    setCallbacks({ onConfirm, onCancel });
    setIsOpen(true);
  }, []);

  const handleConfirm = () => {
    if (callbacks.onConfirm) callbacks.onConfirm();
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (callbacks.onCancel) callbacks.onCancel();
    setIsOpen(false);
  };

  return (
    <PromptContext.Provider value={{ confirm }}>
      {children}
      {isOpen && (
        <PromptConfirm
          message={message}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          hidePrompt={setIsOpen}
        />
      )}
    </PromptContext.Provider>
  );
};