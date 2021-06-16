/**
* Copyright (c) 2021 Matronator
*
* This software is released under the MIT License.
* https://opensource.org/licenses/MIT
*/

export function init(ajaxClass = `ajax`) {
    const links = document.querySelectorAll(`a.${ajaxClass}`)
    if (links) {
        links.forEach(link => {
            link.addEventListener(`click`, e => {
                e.preventDefault()
                onAjax(e.target.href)
            })
        })
    }
}

export async function onAjax(link, data, contentType = `application/json`) {
    const response = await fetch(link, {
        method: data ? `POST` : `GET`,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            ...(data && { 'Content-Type': contentType }),
        },
        ...(data && { body: data })
    })
    const { snippets = {}, redirect = `` } = await response.json()
    if (redirect !== ``) {
        window.location.replace(redirect)
    }
    Object.entries(snippets).forEach(([id, html]) => {
        const elem = document.getElementById(id)
        if (elem) elem.innerHTML = html
    })
    init()
}
