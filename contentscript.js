// content.js
const amazonRegex = /^https?:\/\/(www\.)?amazon\..*/i;
const airbnbRegex = /^https?:\/\/(www\.)?airbnb\..*/i;
const bookingRegex = /^https?:\/\/(www\.)?booking\..*/i;
const littlecowDomain = "https://littlecow.movinglake.com";

let currHref = null;

function sendPageToBackend(email, access_token) {
    // Get Full HTML of the page
    const html = document.documentElement.outerHTML;
    // Get the URL of the page
    const url = window.location.href;
    // Get the title of the page
    const title = document.title;
    // Get the user agent.
    const userAgent = navigator.userAgent;
    // Get the size of the screen.
    const screenWidth = screen.width;
    // Get the description of the page
    const description = document.querySelector('meta[name="description"]')?.content;

    // Send the data using a REST API
    fetch(littlecowDomain + '/v1/post-page', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            url,
            title,
            description,
            html,
            email,
            access_token,
            userAgent,
            screenWidth,
        }),
    })
}


function checkIfLoggedIn(loggedInCallback, loggedOutCallback) {
    chrome.storage.local.get(["email", "access_token"], (value) => {
        if (value.email && value.access_token) {
            loggedInCallback(value.email, value.access_token);
            return;
        }
        loggedOutCallback();
    });
}

let run = false;
if (amazonRegex.test(window.location.href)) {
    console.log("[Littlecow] This page is an Amazon page.");
    run = true;
} else if (airbnbRegex.test(window.location.href)) {
    console.log("[Littlecow] This page is an Airbnb page.");
    run = true;
} else if (bookingRegex.test(window.location.href)) {
    console.log("[Littlecow] This page is a Booking.com page.");
    run = true;
} else {
    console.log("[Littlecow] This page is not an Amazon, Airbnb, or Booking.com page.");
}

function onUrlChange() {
    checkIfLoggedIn((email, token) => {
        console.log("[Littlecow] User is logged in.");
        sendPageToBackend(email, token);
    }, () => {
        console.log("[Littlecow] User is not logged in, nothing to do.");
    });
}

function observeUrlChanges(callback) {
    if (window.location.href !== currHref) {
        currHref = window.location.href;
        callback();
    }
}

if (run) {
    // Handling page navigation for SPAs is a bitch. Run twice per second. If URL changes then send the page.
    setInterval(observeUrlChanges, 500, onUrlChange);
}
