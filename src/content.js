/**
 * Content script — injected into Letterboxd film pages.
 *
 * Reads the user's configured sources from chrome.storage.sync and injects
 * each one into the "Where to watch" services list, matching the native
 * Letterboxd service-item markup.
 */

function getTmdbId() {
  return document.body.dataset.tmdbId || null;
}

function resolveTemplate(template, tmdbId) {
  return template.replace(/\$tmdbid/gi, tmdbId);
}

/**
 * Build a single <p class="service"> element for a source.
 */
function createServiceElement(source, tmdbId) {
  const movieUrl = resolveTemplate(source.link, tmdbId);
  const watchUrl = resolveTemplate(source.playLink, tmdbId);
  const safeName = source.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const maskId = `lbp-mask-${source.id}`;

  const serviceEl = document.createElement("p");
  serviceEl.id = `source-lbp-${source.id}`;
  serviceEl.className = `service -lbp-${safeName}`;
  serviceEl.dataset.lbpSource = source.id;

  // --- label link (icon + name) ---
  const labelLink = document.createElement("a");
  labelLink.href = movieUrl;
  labelLink.className = "label tooltip";
  labelLink.target = "_blank";
  labelLink.rel = "noopener noreferrer";
  labelLink.dataset.originalTitle = `Watch on ${source.name}`;

  // brand / icon inside Letterboxd's rounded-square SVG clip
  const brandSpan = document.createElement("span");
  brandSpan.className = "brand";

  const svgNS = "http://www.w3.org/2000/svg";
  const xlinkNS = "http://www.w3.org/1999/xlink";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("version", "1.1");
  svg.setAttribute("width", "24");
  svg.setAttribute("height", "24");
  svg.setAttribute("viewBox", "0 0 24 24");

  const defs = document.createElementNS(svgNS, "defs");
  const clipPath = document.createElementNS(svgNS, "clipPath");
  clipPath.setAttribute("id", maskId);
  const maskPath = document.createElementNS(svgNS, "path");
  maskPath.setAttribute(
    "d",
    "M12,24 C2.372583,24 0,21.627417 0,12 C0,2.372583 2.372583,0 12,0 C21.627417,0 24,2.372583 24,12 C24,21.627417 21.627417,24 12,24 Z"
  );
  clipPath.appendChild(maskPath);
  defs.appendChild(clipPath);
  svg.appendChild(defs);

  const image = document.createElementNS(svgNS, "image");
  image.setAttribute("clip-path", `url(#${maskId})`);
  image.setAttribute("width", "24");
  image.setAttribute("height", "24");
  image.setAttributeNS(xlinkNS, "xlink:href", source.icon);
  svg.appendChild(image);

  const outlinePath = document.createElementNS(svgNS, "path");
  outlinePath.setAttribute(
    "d",
    "M12,23.5 C21.2262746,23.5 23.5,21.2262746 23.5,12 C23.5,2.77372538 21.2262746,0.5 12,0.5 C2.77372538,0.5 0.5,2.77372538 0.5,12 C0.5,21.2262746 2.77372538,23.5 12,23.5 Z"
  );
  outlinePath.setAttribute("class", "overlay");
  outlinePath.setAttribute("stroke-opacity", "0.35");
  outlinePath.setAttribute("stroke", "#FFFFFF");
  outlinePath.setAttribute("fill", "rgba(0,0,0,0)");
  svg.appendChild(outlinePath);

  brandSpan.appendChild(svg);

  // title / name
  const titleSpan = document.createElement("span");
  titleSpan.className = "title";
  const nameSpan = document.createElement("span");
  nameSpan.className = "name";
  nameSpan.textContent = source.name;
  titleSpan.appendChild(nameSpan);

  labelLink.appendChild(brandSpan);
  labelLink.appendChild(document.createTextNode(" "));
  labelLink.appendChild(titleSpan);

  // --- options (the "Play" tag) ---
  const optionsSpan = document.createElement("span");
  optionsSpan.className = "options js-film-availability-options";

  const playLink = document.createElement("a");
  playLink.className = "link -stream";
  playLink.href = watchUrl;
  playLink.target = "_blank";
  playLink.rel = "noopener noreferrer";
  playLink.title = `Watch on ${source.name}`;

  const playText = document.createElement("span");
  playText.className = "extended";
  playText.textContent = "Play";
  playLink.appendChild(playText);
  optionsSpan.appendChild(document.createTextNode(" "));
  optionsSpan.appendChild(playLink);
  optionsSpan.appendChild(document.createTextNode(" "));

  // Assemble
  serviceEl.appendChild(document.createTextNode(" "));
  serviceEl.appendChild(labelLink);
  serviceEl.appendChild(document.createTextNode(" "));
  serviceEl.appendChild(optionsSpan);
  serviceEl.appendChild(document.createTextNode(" "));

  return serviceEl;
}

/**
 * Try to inject all sources into the services list.
 * Returns true if injection succeeded (services section with items exists).
 */
function tryInject(sources, tmdbId) {
  // Check if we already injected
  if (document.querySelector("[data-lbp-source]")) return true;

  const servicesSection = document.querySelector(
    "#watch .services, section.watch-panel .services"
  );

  if (!servicesSection) {
    console.log("[LBP] No .services section yet");
    return false;
  }

  const firstService = servicesSection.querySelector("p.service");
  if (!firstService) {
    console.log("[LBP] .services section exists but has no service items yet");
    return false;
  }

  // Insert each source in order, all before the first native service
  for (const source of sources) {
    const el = createServiceElement(source, tmdbId);
    servicesSection.insertBefore(el, firstService);
  }

  console.log(`[LBP] Injected ${sources.length} source(s) into services list`);
  return true;
}

async function init() {
  const tmdbId = getTmdbId();
  if (!tmdbId) {
    console.log("[LBP] No TMDB ID found, skipping");
    return;
  }

  // Load sources from storage
  const data = await chrome.storage.sync.get({ sources: [] });
  const sources = data.sources;

  if (sources.length === 0) {
    console.log("[LBP] No sources configured, skipping");
    return;
  }

  console.log(`[LBP] Film page detected (TMDB ${tmdbId}), ${sources.length} source(s) to inject`);

  // Try immediately
  if (tryInject(sources, tmdbId)) return;

  console.log("[LBP] Watch panel not ready yet, waiting…");

  const observer = new MutationObserver(() => {
    if (tryInject(sources, tmdbId)) {
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Safety timeout
  setTimeout(() => {
    observer.disconnect();
    if (!document.querySelector("[data-lbp-source]")) {
      tryInject(sources, tmdbId);
      console.log("[LBP] Timed out waiting, final attempt done");
    }
  }, 15000);
}

// Run when page is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
