// content.js
const amazonRegex = /^https?:\/\/(www\.)?amazon\..*/i;
const airbnbRegex = /^https?:\/\/(www\.)?airbnb\..*/i;
const bookingRegex = /^https?:\/\/(www\.)?booking\..*/i;
const littlecowDomain = "https://littlecow.movinglake.com";

let currHref = null;

mappings = {
    "amazon.*": "amazon",
    "airbnb.*": "airbnb",
    "booking.com": "booking",
}

function parseHTML(parserConfig) {
    const data = {};
    for (const pageParser in parserConfig) {
        const parser = parserConfig[pageParser];
        const pathRegex = new RegExp(parser.pathRegex);
        if (!pathRegex.test(location.pathname+location.search)) {
            continue;
        }
        console.log("[Littlecow] Found parser: " + parser.name + " for path: " + window.location.pathname);
        console.log("[Littlecow] Using parser: " + JSON.stringify(parser));
        data["pageParser"] = parser.name; 
        for (const selectorConfig in parser.dataFields) {
            const cfg = parser.dataFields[selectorConfig];
            const element = document.querySelectorAll(cfg.selector);
            if (!element) {
                console.log("[Littlecow] No element found for selector: " + JSON.stringify(cfg));
                continue;
            }
            const values = [];
            for (const value of element) {
                values.push(value.innerHTML);
            }
            data[cfg.name] = values;
        }
        break;
    }
    return data;
}

function parseAndSend(email, access_token) {
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

    chrome.storage.local.get(["privacy"], (value) => {
        if (value.privacy) {
            console.log("[Littlecow] Private data is enabled. Send full HTML.");
            // Send the data using a REST API
            fetch(littlecowDomain + '/v1/post-page', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    access_token: access_token,
                    url: url,
                    title: title,
                    privacy: value.privacy,
                    userAgent: userAgent,
                    screenWidth: screenWidth,
                    description: description,
                    html: document.documentElement.outerHTML
                }),
            }).then((httpResponse) => {
                if (!httpResponse.ok) {
                    console.error('[post-page] ' + JSON.stringify(httpResponse));
                    return;
                }
                console.log("[Littlecow] Page sent successfully.");
            });
        } else {
            console.log("[Littlecow] Privacy is disabled. Send only relevant data.");

            // Get the domain of the page.
            const domain = window.location.hostname.replace(/^www\./, "");
            // Get the mapping for the domain.
            const mapping = mappings[domain] || mappings[domain.replace(/\..*/, ".*")] || "Other";
            if (mapping === "Other") {
                console.log("[Littlecow] This page is not supported.");
                return;
            }

            // Fetch from Github the json parser file.
            fetch("https://raw.githubusercontent.com/movinglake/littlecow/master/parsers/" + mapping + ".json").then((response) => {
                if (!response.ok) {
                    console.error(response);
                    return;
                }
                response.text().then((jsonFile) => {
                    // Parse the json file.
                    const parserConfig = JSON.parse(jsonFile);
                    // Parse the HTML.
                    const data = parseHTML(parserConfig);
                    if (!data) {
                        console.log("[Littlecow] No data found on this page.");
                        return;
                    }
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
                            data,
                            email,
                            access_token,
                            userAgent,
                            screenWidth,
                            privacy: value.privacy,
                        }),
                    }).then((httpResponse) => {
                        if (!httpResponse.ok) {
                            console.error('[post-page] ' + JSON.stringify(httpResponse));
                            return;
                        }

                        httpResponse.json().then((value) => {
                            console.log(value);
                        });
                    });
                });
            });
        }
    });
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
        parseAndSend(email, token);
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
