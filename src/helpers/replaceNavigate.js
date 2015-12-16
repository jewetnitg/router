// originally taken from Grapnel.fragment.set, changed to replace the current history item instead of adding to the history
function replaceNavigate(grapnel, frag) {
  if (grapnel.options.mode === 'pushState') {
    frag = (grapnel.options.root) ? (grapnel.options.root + frag) : frag;
    window.history.replaceState({}, "", frag);
  } else if (window.location) {
    frag = (grapnel.options.hashBang ? '!' : '') + frag;
    if (!window.history.replaceState) {
      console.error(`Can't replace url to '${frag}', replaceState not available, falling back to doing normal navigate, which creates a history item.`);
      window.location.hash = frag;
    } else {
      window.history.replaceState({}, "", `#${frag}`);
    }
  } else {
    window._pathname = frag || '';
  }
}

export default replaceNavigate;