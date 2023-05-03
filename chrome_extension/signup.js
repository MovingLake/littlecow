const littlecowDomain = "https://littlecow.movinglake.com";

// Add event listeners to the buttons.
document.getElementById("signup").addEventListener("click", signup);
document.getElementById("login").addEventListener("click", signup);
document.getElementById("logout").addEventListener("click", logout);
document.getElementById("stats").addEventListener("click", showStats);
document.getElementById("walletSubmit").addEventListener("click", setWallet);

function toggleButtons(loggedIn) {
    if (loggedIn) {
        document.getElementById("signup").hidden = true;
        document.getElementById("login").hidden = true;
        document.getElementById("logout").hidden = false;
        document.getElementById("stats").hidden = false;
        document.getElementById("statsResults").hidden = false;
        document.getElementById("wallet").hidden = false;
        document.getElementById("walletInput").hidden = false;
        document.getElementById("walletSubmit").hidden = false;
        showStats();
    } else {
        document.getElementById("signup").hidden = false;
        document.getElementById("login").hidden = false;
        document.getElementById("logout").hidden = true;
        document.getElementById("stats").hidden = true;
        document.getElementById("statsResults").hidden = true;
        document.getElementById("wallet").hidden = true;
        document.getElementById("walletInput").hidden = true;
        document.getElementById("walletSubmit").hidden = true;
        getWallet();
    }
}


chrome.storage.local.get(["email", "access_token"], (value) => {
    if (value.email && value.access_token) {
        toggleButtons(true);
        document.getElementById("email").innerHTML = value.email;
        console.log("Found email on local storage: " + value.email);  
        return;
    } else {
        console.log("No email found on local storage: " + JSON.stringify(email));
    }
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (!token) {
            console.error(response);
            return;
        }
        if (token) {
            fetch(littlecowDomain+'/v1/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token
                }),
            }).then((httpResponse) => {
                if (!httpResponse.ok) {
                    console.error('[auth] '+ JSON.stringify(httpResponse));
                    return;
                }
        
                httpResponse.json().then((value) => { 
                    let body = JSON.parse(value.body)

                    // Store the email in local storage.
                    chrome.storage.local.set({"email": body.email, "access_token": body.access_token }, () => {
                        console.log('Stored email successfully: ');
                    });
                    toggleButtons(true);
                    document.getElementById("email").innerHTML = body.email;
                    console.log("User signed-in: " + JSON.stringify(body.email));  
                });
            });
        } else {
            alert(response);
        }
    });
});

function signup() {
    chrome.identity.getAuthToken({ interactive: true }, (token)  => {
        if (token) {
            console.log(token);
            fetch(littlecowDomain+'/v1/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token
                }),
            }).then((httpResponse) => {
                if (!httpResponse.ok) {
                    console.error('[signup] '+ JSON.stringify(httpResponse));
                    return;
                }

                httpResponse.json().then((value) => {
                    // Store the email in local storage.
                    chrome.storage.local.set({"email": value.email, "access_token": value.access_token }, () => {
                        console.log('Stored email!');
                    });
                    toggleButtons(true);
                    document.getElementById("email").innerHTML = value.email;
                });
            });

        } else {
            alert(response);
        }
    });
}
function logout() {
    toggleButtons(false);
    document.getElementById("email").innerHTML = "";

    chrome.storage.local.remove(["email", "access_token"], () => {
        console.log('Removed email');
    });
}
function showStats() {
    // Query the stats from the backend.
    chrome.storage.local.get(["email", "access_token"], (value) => {
        if (!value.email || !value.access_token) {
            console.error("No email or access_token found on local storage.");
            return;
        }

        fetch(littlecowDomain+'/v1/stats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: value.email,
                access_token: value.access_token
            }),
        }).then((httpResponse) => {
            if (!httpResponse.ok) {
                console.error('[stats] '+ JSON.stringify(httpResponse));
                return;
            }
            httpResponse.json().then((value) => {
                document.getElementById("statsResults").innerHTML = JSON.stringify(value.stats);
            });
        });
    });
}
function setWallet() {
    chrome.storage.local.get(["email", "access_token"], (value) => {
        if (!value.email || !value.access_token) {
            console.error("No email or access_token found on local storage.");
            return;
        }

        fetch(littlecowDomain+'/v1/set-wallet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: value.email,
                access_token: value.access_token,
                wallet: document.getElementById("walletInput").value
            }),
        }).then((httpResponse) => {
            if (!httpResponse.ok) {
                console.error('[set-wallet] '+ JSON.stringify(httpResponse));
                return;
            }
        });
    });
}
function getWallet() {
    chrome.storage.local.get(["email", "access_token"], (value) => {
        if (!value.email || !value.access_token) {
            console.error("No email or access_token found on local storage.");
            return;
        }

        fetch(littlecowDomain+'/v1/get-wallet', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: value.email,
                access_token: value.access_token
            }),
        }).then((httpResponse) => {
            if (!httpResponse.ok) {
                console.error('[get-wallet] '+ JSON.stringify(httpResponse));
                return;
            }
            httpResponse.json().then((value) => {
                document.getElementById("wallet").innerHTML = value.wallet;
            });
        });
    });
}