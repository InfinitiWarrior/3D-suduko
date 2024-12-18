// loading-screen.js

// Function to hide the loading screen with a fade-out effect
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    // Add a class to trigger the fade-out transition
    loadingScreen.classList.add('fade-out');
    
    // Wait for the transition to finish, then hide the screen completely
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 1000); // Adjust the time to match your fade-out duration
  }
}

// Listen for messages from other scripts, e.g., when the cube is loaded
window.addEventListener('message', (event) => {
  if (event.data === 'Cube Loaded') {
    hideLoadingScreen();  // Hide the loading screen when the cube is loaded
  }
});

// Optional: You can have a fallback to hide the loading screen after a timeout
setTimeout(() => {
  hideLoadingScreen();
}, 10000); // Hide the loading screen after 10 seconds if no message is received
