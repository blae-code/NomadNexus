import { useState, useEffect } from 'react';

export const useRiggsyGatedListening = () => {
  const [isRiggsyListening, setIsRiggsyListening] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check for AltLeft or AltRight keys
      if (event.altKey && !isRiggsyListening) {
        event.preventDefault(); // Prevent default browser behavior like opening menus
        setIsRiggsyListening(true);
        // Log for debugging or indicating active listening
        console.log("Riggsy is now listening..."); 
      }
    };

    const handleKeyUp = (event) => {
      // Check for AltLeft or AltRight keys
      if (!event.altKey && isRiggsyListening) {
        setIsRiggsyListening(false);
        // Log for debugging or indicating listening stopped
        console.log("Riggsy has stopped listening.");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRiggsyListening]);

  return { isRiggsyListening };
};
