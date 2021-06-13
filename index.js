/**
* Copyright (c) 2021 Matronator
*
* This software is released under the MIT License.
* https://opensource.org/licenses/MIT
*/

function registerAjaxHandlers() {
    const links = document.querySelectorAll(`a.ajax`)
    if (links) {
        links.forEach(link => {
            link.addEventListener(`click`, e => {
                e.preventDefault()
                handleNetteResponse(e.target.href)
            })
        })
    }
}

async function handleNetteResponse(link, data, contentType = `application/json`) {
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
    registerAjaxHandlers()
}

module.exports.registerAjaxHandlers = registerAjaxHandlers
module.exports.handleNetteResponse = handleNetteResponse
