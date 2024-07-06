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
    popup.textContent = 'Loading bookmarks...'

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
            if (!(await chrome.runtime.sendMessage({action: 'getBookmarkActiveState', id: bookmarkId}))) continue;
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
    
        popup.textContent = "";

        if (sections.length == 0) {
            const noBookmark = document.createElement("div");
            const textElem = document.createElement("span");
            textElem.textContent = "활성화된 북마크가 없어요"
            textElem.style = "display: inline-block; vertical-align: middle; color: #999";
            noBookmark.appendChild(textElem);
            noBookmark.innerHTML += '<svg xmlns="http://www.w3.org/2000/svg" fill="#999999" style="display: inline-block; vertical-align: middle" height="24px" viewBox="0 -960 960 960" width="24px "><path d="M479.69-432.5q-44.97 0-83.42 21.75Q357.83-389 330-353.5q-7.5 9.5-1.72 20t19.29 10.5q3.1 0 6.76-1.75 3.67-1.75 6.67-3.75 20.5-29.5 51.01-47.75 30.52-18.25 67-18.25 36.49 0 67.38 17.33 30.89 17.34 51.11 46.67 2.5 2 5.55 4.75t6.8 2.75q13.02 0 20.34-11.08 7.31-11.07.31-18.92-26.83-37.5-66.22-58.5t-84.59-21Zm120.99-92q16.32 0 27.57-11.43 11.25-11.42 11.25-27.75 0-16.32-11.43-27.57-11.42-11.25-27.75-11.25-16.32 0-27.57 11.43-11.25 11.42-11.25 27.75 0 16.32 11.43 27.57 11.42 11.25 27.75 11.25Zm-241 0q16.32 0 27.57-11.43 11.25-11.42 11.25-27.75 0-16.32-11.43-27.57-11.42-11.25-27.75-11.25-16.32 0-27.57 11.43-11.25 11.42-11.25 27.75 0 16.32 11.43 27.57 11.42 11.25 27.75 11.25ZM480.51-153q-67.42 0-127.14-25.52-59.72-25.53-104.62-70.35-44.9-44.83-70.32-104.29Q153-412.62 153-480.22q0-67.69 25.52-126.91 25.53-59.22 70.35-104.12 44.83-44.9 104.29-70.32Q412.62-807 480.22-807q67.69 0 126.91 25.52 59.22 25.53 104.12 70.35 44.9 44.83 70.32 104.05Q807-547.85 807-480.51q0 67.42-25.52 127.14-25.53 59.72-70.35 104.62-44.83 44.9-104.05 70.32Q547.85-153 480.51-153ZM480-480Zm-.03 309.5q128.53 0 219.03-90.47 90.5-90.46 90.5-219 0-128.53-90.47-219.03-90.46-90.5-219-90.5-128.53 0-219.03 90.47-90.5 90.46-90.5 219 0 128.53 90.47 219.03 90.46 90.5 219 90.5Z"/></svg>'
            
            popup.appendChild(noBookmark)
        } else {
            sections.forEach(section => {
                popup.appendChild(section)
            });
        }
    })
})();