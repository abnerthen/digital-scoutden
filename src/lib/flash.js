// A one-shot message that survives a full page navigation.
//
// Setting a password ends in window.location.replace('/'), which tears down
// React entirely — so the confirmation has to be parked somewhere the next page
// load can find it. sessionStorage is scoped to the tab and clears itself when
// the tab closes, which is exactly the lifetime a flash message wants.

const KEY = 'storeroom.flash'

/** Queue a message to be shown after the next navigation. */
export function setFlash(message) {
  try {
    sessionStorage.setItem(KEY, message)
  } catch {
    // Storage can be unavailable (Safari private browsing). A missing
    // confirmation is not worth failing the navigation over.
  }
}

/** Read the queued message and clear it, so a refresh does not show it twice. */
export function takeFlash() {
  try {
    const message = sessionStorage.getItem(KEY)
    if (message) sessionStorage.removeItem(KEY)
    return message
  } catch {
    return null
  }
}
