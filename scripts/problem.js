console.log("injected!");

(async () => {
    let isFirefox = false;
    try {
        console.log(browser);
        isFirefox = true;
    } catch { }
    
    console.log(isFirefox)

    const credentials = await chrome.runtime.sendMessage({ action: 'credentials' })
    const pid = Number(location.href.split('/').at(-1))

    if (credentials == null) return
    const user = credentials['user']
    if (Date.now() > Date.parse(user['proUntil'])) return

    const favBtn = document.getElementById('favorite_button');
    const bookmarkBtn = favBtn.cloneNode(true)
    bookmarkBtn.id = 'bookmark_button'
    bookmarkBtn.childNodes[0].className = 'glyphicon glyphicon-bookmark'
    bookmarkBtn.childNodes[0].id = 'bookmark_image'

    bookmarkBtn.setAttribute('open', 0)

    bookmarkBtn.onclick = (e) => {
        if (e.target.id != 'bookmark_button' && e.target.id != 'bookmark_image') return;

        if (bookmarkBtn.getAttribute('open') == 0) {
            bookmarkBtn.setAttribute('open', 1)
        } else {
            bookmarkBtn.setAttribute('open', 0)
        }
    }

    const popup = document.createElement('div')
    popup.id = 'bookmark_popup'
    popup.innerHTML = 'Loading bookmarks...'

    favBtn.parentNode.insertBefore(bookmarkBtn, favBtn.nextSibling)
    bookmarkBtn.appendChild(popup)

    let loaded = false;
    bookmarkBtn.addEventListener('click', async () => {
        if (loaded) return;
        loaded = true;
        const bookmarks = await chrome.runtime.sendMessage({ action: 'bookmarks' });
    
        sections = []
        for (const bookmark of bookmarks.items) {
            const bookmarkId = bookmark.bookmarkFolderId;
            const bookmarkName = bookmark.displayName;
    
            const bookmarksection = document.createElement('p');
            bookmarksection.className = 'bookmark-section'
            if (isFirefox) bookmarksection.setAttribute('firefox', 'true')
    
            const label = document.createElement('label');
            const check = document.createElement('input');
            check.type = 'checkbox'
            check.checked = false
            check.id = `bookmark-${bookmarkId}`
            check.value = bookmarkId
    
            check.onchange = (e) => {
                if (e.target.checked) {
                    chrome.runtime.sendMessage({ 
                        action: 'addProblem',
                        id: e.target.value,
                        handle: user.handle,
                        problemId: pid,
                    })
                    .then(res => {
                        console.log(res)
                        if (!res) e.target.checked = false;
                    })
                } else {
                    chrome.runtime.sendMessage({ 
                        action: 'removeProblem',
                        id: e.target.value,
                        handle: user.handle,
                        problemId: pid,
                    })
                    .then(res => {
                        if (!res) e.target.checked = true;
                    })
                }
            }
    
            const problems = await chrome.runtime.sendMessage({ action: 'bookmarkProblems', id: bookmark.bookmarkFolderId });
            if (problems.some(i => i["problemId"] == pid)) check.checked = true;
    
            
            label.setAttribute('for', `bookmark-${bookmarkId}`)
            label.textContent = bookmarkName
            bookmarksection.appendChild(check)
            bookmarksection.appendChild(label)
            sections.push(bookmarksection)
        }
    
        popup.innerHTML = "";
    
        sections.forEach(section => {
            popup.appendChild(section)
        });
    })
})();