/**
* Copyright (c) 2021 Matronator
*
* This software is released under the MIT License.
* https://opensource.org/licenses/MIT
*/

const hooks = {
    onAjax: [],
    onInit: [],
}

/**
 * Register AJAX handlers. Currently supports links and forms (`a` and `form` tags).
 * @param {String} ajaxClass CSS class used for AJAX links (default: `ajax`)
 */
function init(ajaxClass = `ajax`) {
    const links = document.querySelectorAll(`a.${ajaxClass}`)
    if (links) {
        links.forEach(link => {
            link.addEventListener(`click`, e => {
                e.preventDefault()
                onAjax(e.target.href)
            })
        })
    }
    const forms = document.querySelectorAll(`form.${ajaxClass}`)
    if (forms) {
        forms.forEach(form => {
            form.addEventListener(`submit`, e => {
                e.preventDefault()
                const formData = new FormData(form)
                const params = (new URLSearchParams(formData)).toString()
                if (form.method.toLowerCase() === `post`) {
                    handleNetteResponse(form.action, params, `application/x-www-form-urlencoded`)
                        .catch(err => console.error(err))
                } else {
                    handleNetteResponse(`${form.action}?${params}`)
                        .catch(err => console.error(err))
                }
            })
        })
    }
    hooks.onInit.forEach(hook => {
        if (hook.fn instanceof Function) {
            hook.fn(...hook.args)
        }
    })
}

/**
 * Update snippets with data from the response object or redirect to a new URL if set in the response.
 * @param {String} link URL to call
 * @param {*} data HTTP Request body
 * @param {String} contentType Content-Type header (default: `application/json`)
 */
async function onAjax(link, data, contentType = `application/json`) {
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

    hooks.onAjax.forEach(hook => {
        if (hook.fn instanceof Function) {
            hook.fn(...hook.args)
        }
    })
}

/**
 * Add function to be executed after onAjax event.
 * @param {Function} callback Function to execute
 * @param  {...any} args Function arguments
 */
function onAjaxHook(callback, ...args) {
    onHook(`onAjax`, callback, args)
}

/**
 * Add function to be executed after onInit event.
 * @param {Function} callback Function to execute
 * @param  {...any} args Function arguments
 */
function onInitHook(callback, ...args) {
    onHook(`onInit`, callback, args)
}

/**
 * Add function to be executed after an event.
 * @param {String} event Name of the event to hook
 * @param {*} callback Function to execute
 * @param  {...any} args Function arguments
 */
function onHook(event, callback, ...args) {
    if (hooks[event] instanceof Array) {
        hooks[event].push({ fn: callback, args: args })
    }
}

const ajaxette = { init, onAjax, hooks, onAjaxHook, onInitHook, onHook }

module.exports = ajaxette
