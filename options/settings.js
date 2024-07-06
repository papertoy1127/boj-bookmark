document.addEventListener("DOMContentLoaded", (async () => {
    let isFirefox = false;
    try {
        console.log(browser);
        isFirefox = true;
    } catch { }
    
    const loginElem = document.getElementById("login")
    const sessionElem = loginElem.parentNode;
    const mainElem = document.getElementsByTagName("main")[0]
    const loadingElem = document.getElementById("loading")
    const warningElem = document.getElementById("warning")

    const credentials = await chrome.runtime.sendMessage({ action: 'credentials' })
    console.log(credentials)
    if (credentials == null) {
        loading.remove();
        warningElem.className = "";
        return
    }

    loginElem.remove()
    const cropElem = document.createElement("div")
    cropElem.className = "crop"
    const profileElem = document.createElement("img")
    const user = credentials['user']

    let profileUrl = user["profileImageUrl"];
    if (profileUrl == null || profileUrl == undefined) profileUrl = "https://static.solved.ac/misc/360x360/default_profile.png"
    profileElem.setAttribute("src", profileUrl)
    profileElem.id = "profileImg"
    cropElem.appendChild(profileElem)
    sessionElem.append(cropElem)

    if (Date.now() > Date.parse(user['proUntil'])) {
        loading.remove();
        warningElem.className = "";
        return
    }

    const bookmarkContainer = document.createElement("div");

    const bookmarks = await chrome.runtime.sendMessage({ action: 'bookmarks' });
    console.log(bookmarks["items"])
    for (const b of bookmarks["items"]) {
        const container = document.createElement("div");
        const bookmarkId = b.bookmarkFolderId;
        const bookmarkName = b.displayName;

        const label = document.createElement('label');
        const check = document.createElement('input');
        check.type = 'checkbox'
        check.checked = await chrome.runtime.sendMessage({ action: 'getBookmarkActiveState', id: bookmarkId })
        check.id = `bookmark-${bookmarkId}`
        check.value = bookmarkId

        
        check.onchange = (e) => {
            chrome.runtime.sendMessage({ 
                action: 'setBookmarkActiveState',
                id: e.target.value,
                value: e.target.checked,
            })
        }

        label.setAttribute('for', `bookmark-${bookmarkId}`)
        label.textContent = b.displayName;
        container.appendChild(check)
        container.appendChild(label)
        bookmarkContainer.appendChild(container);
    }

    mainElem.textContent = ""
    mainElem.appendChild(bookmarkContainer);
}));
