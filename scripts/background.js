async function verifyCredentials() {
    const res = await fetch(`https://solved.ac/api/v3/account/verify_credentials`)
    console.log(res)
    try {
        return await res.json()
    } catch {
        return null
    }
}

async function bookmarks() {
    const res = await fetch(`https://solved.ac/api/v3/bookmark/list?page=1`)
    return await res.json()
}

async function queryAll(url_page) {
    let res = await (await fetch(url_page(1))).json()
    let count = res.count
    let page = 1
    const items = res.items
    while (count > page * 50) {
        res = await (await fetch(url_page(page))).json()
        items.push(...res.items)
        page++;
    }

    return items
}

async function bookmarkProblems(bookmarkId) {
    const url_page = page => `https://solved.ac/api/v3/bookmark/problems?bookmarkFolderId=${bookmarkId}&page=${page}`
    return await queryAll(url_page)
}

async function addProblem(bookmarkId, handle, problemId) {
    console.log(problemId);
    try {
        const res = await fetch('https://solved.ac/api/v3/bookmark/append_problems',
            {
                method: 'POST',
                body: JSON.stringify({
                    handle: handle,
                    bookmarkFolderId: bookmarkId,
                    problemIds: [problemId],
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return res.ok;
    } catch (e) {
        console.log(e);
        return false;
    }
}

async function removeProblem(bookmarkId, handle, problemId) {
    try {
        const res = await fetch('https://solved.ac/api/v3/bookmark/remove_problems',
            {
                method: 'DELETE',
                body: JSON.stringify({
                    handle: handle,
                    bookmarkFolderId: bookmarkId,
                    problemIds: [problemId],
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return res.ok;
    } catch (e) {
        console.log(e);
        return false;
    }
}

async function getBookmarkActiveState(bookmarkId) {
    const disabled = (await chrome.storage.sync.get("disabledThemes")).disabledThemes;
    if (disabled == undefined) {
        await chrome.storage.sync.set({ "disabledThemes": [] });
        return true;
    }

    return !disabled.includes(bookmarkId);
}

async function setBookmarkActiveState(bookmarkId, value) {
    const disabled = (await chrome.storage.sync.get("disabledThemes")).disabledThemes;
    if (disabled == undefined) disabled = []
    if (value && disabled.includes(bookmarkId)) {
        disabled.splice(disabled.indexOf(bookmarkId), 1);
    }

    if (!value && !disabled.includes(bookmarkId)) {
        disabled.push(bookmarkId);
    }

    await chrome.storage.sync.set({ "disabledThemes": disabled });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'credentials':
            verifyCredentials()
            .then(res => sendResponse(res))
            break
        case 'bookmarks':
            bookmarks()
            .then(res => sendResponse(res))
            break
        case 'bookmarkProblems':
            bookmarkProblems(message.id)
            .then(res => sendResponse(res))
            break
        case 'addProblem':
            addProblem(message.id, message.handle, message.problemId)
            .then(res => sendResponse(res))
            break
        case 'removeProblem':
            removeProblem(message.id, message.handle, message.problemId)
            .then(res => sendResponse(res))
            break
        case 'getBookmarkActiveState':
            getBookmarkActiveState(message.id)
            .then(res => sendResponse(res))
            break
        case 'setBookmarkActiveState':
            setBookmarkActiveState(message.id, message.value)
            .then(res => sendResponse(res))
            break
    }

    return true;
});