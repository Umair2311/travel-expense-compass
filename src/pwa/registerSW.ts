
type RegisterSWOptions = {
  onUpdate?: () => void;
  onSuccess?: () => void;
};

export const registerSW = ({ onUpdate, onSuccess }: RegisterSWOptions = {}) => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;

      navigator.serviceWorker.register(swUrl)
        .then(registration => {
          // Check for updates on controller change
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            onUpdate?.();
          });

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // At this point, the updated precached content has been fetched,
                  // but the previous service worker will still serve the older
                  // content until all client tabs are closed.
                  console.log('New content is available and will be used when all tabs for this page are closed.');
                  
                  // Execute callback
                  onUpdate?.();
                } else {
                  // At this point, everything has been precached.
                  console.log('Content is cached for offline use.');
                  
                  // Execute callback
                  onSuccess?.();
                }
              }
            };
          };
        })
        .catch(error => {
          console.error('Error during service worker registration:', error);
        });
    });
  }
};
