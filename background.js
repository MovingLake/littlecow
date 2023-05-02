// background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.message === 'signIn') {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          sendResponse({ token: null });
          return;
        }
        console.log(token);
        sendResponse({ token: token });

        // Send the token to your backend server to authenticate the user
      });
      return;
    } 
    sendResponse({ token: null, message: 'No message ' + JSON.stringify(message.message)});
  });