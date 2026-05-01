
// --- Autenticação simples ---
const LOGIN_KEY = "autenticado";
const AUTH_PASS_KEY = "uploadPass";

const loginModal = document.getElementById("loginModal");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const galleryDiv = document.getElementById("gallery");

function isAuthenticated() {
  return localStorage.getItem(LOGIN_KEY) === "true" && !!localStorage.getItem(AUTH_PASS_KEY);
}

function getAuthHeader() {
  const pass = localStorage.getItem(AUTH_PASS_KEY) || "";
  return { Authorization: `Bearer ${pass}` };
}

function showLoginError() {
  loginError.style.display = 'block';
  loginModal.style.display = 'flex';
}

function showLogin() {
  loginError.style.display = 'none';
  loginModal.style.display = 'flex';
}

function hideLogin() {
  loginError.style.display = 'none';
  loginModal.style.display = 'none';
}

// Login form handler
loginForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const passInput = document.getElementById('loginPassword');
  const pass = passInput ? passInput.value : '';
  if (!pass) return;
  localStorage.setItem(AUTH_PASS_KEY, pass);
  localStorage.setItem(LOGIN_KEY, 'true');
  hideLogin();
  const ok = await loadGallery();
  if (!ok) {
    // authentication failed on server
    loginError.style.display = 'block';
    localStorage.removeItem(AUTH_PASS_KEY);
    localStorage.removeItem(LOGIN_KEY);
    showLogin();
  }
});

// Upload modal and form handlers
const uploadBtn = document.getElementById('uploadBtn');
const uploadModal = document.getElementById('uploadModal');
const uploadClose = uploadModal ? uploadModal.querySelector('.close') : null;
const uploadForm = document.getElementById('uploadForm');
if (uploadBtn) uploadBtn.addEventListener('click', () => { if (uploadModal) uploadModal.style.display = 'flex'; });
if (uploadClose) uploadClose.addEventListener('click', () => { uploadModal.style.display = 'none'; });
window.addEventListener('click', (ev) => { if (ev.target === uploadModal) uploadModal.style.display = 'none'; });

if (uploadForm) uploadForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const form = uploadForm;
  const fileInput = document.getElementById('media');
  if (!fileInput || !fileInput.files || !fileInput.files[0]) {
    alert('Selecione um arquivo para enviar.');
    return;
  }
  const formData = new FormData();
  formData.append('media', fileInput.files[0]);
  const caption = document.getElementById('caption') ? document.getElementById('caption').value : '';
  const date = document.getElementById('date') ? document.getElementById('date').value : '';
  formData.append('caption', caption);
  formData.append('date', date);
  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData,
      headers: getAuthHeader()
    });
    const result = await response.json();
    if (response.ok) {
      alert('Upload realizado com sucesso!');
      form.reset();
      if (uploadModal) uploadModal.style.display = 'none';
      loadGallery();
    } else {
      alert(result.error || 'Erro ao enviar mídia.');
    }
  } catch (err) {
    alert('Erro de conexão com o servidor.');
  }
});


let allMediaList = [];
let currentDisplayedList = [];
let currentSearch = "";
let currentSort = "date-desc";


  function renderGallery(mediaList) {
    galleryDiv.innerHTML = '';
    if (Array.isArray(mediaList) && mediaList.length > 0) {
      currentDisplayedList = mediaList;
      mediaList.forEach((media, idx) => {
        const mediaItem = document.createElement('div');
        mediaItem.className = 'media-item';
        mediaItem.setAttribute('data-index', idx);

        const hiddenTitle = document.createElement('span');
        hiddenTitle.className = 'media-title';
        hiddenTitle.style.display = 'none';
        hiddenTitle.textContent = media.caption || '';
        mediaItem.appendChild(hiddenTitle);

        const thumbWrap = document.createElement('div');
        thumbWrap.className = 'media-thumb-wrap';
        const ext = media.name.split('.').pop().toLowerCase();
        if (["mp4", "webm", "ogg"].includes(ext)) {
          const v = document.createElement('video');
          v.className = 'media-thumb';
          v.src = media.url;
          v.controls = true;
          v.preload = 'metadata';
          thumbWrap.appendChild(v);
        } else {
          const img = document.createElement('img');
          img.className = 'media-thumb';
          img.src = media.url;
          img.alt = media.caption || '';
          thumbWrap.appendChild(img);
        }

        mediaItem.appendChild(thumbWrap);

        if (media.date) {
          const dateEl = document.createElement('span');
          dateEl.className = 'media-date';
          dateEl.style.display = 'block';
          dateEl.style.color = '#888';
          dateEl.style.fontSize = '0.95em';
          dateEl.style.marginBottom = '4px';
          dateEl.textContent = `📅 ${media.date}`;
          mediaItem.appendChild(dateEl);
        }

        const captionP = document.createElement('p');
        captionP.textContent = media.caption || '';
        mediaItem.appendChild(captionP);

        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.setAttribute('data-name', media.name);
        delBtn.textContent = '🗑️ Apagar';
        mediaItem.appendChild(delBtn);

        galleryDiv.appendChild(mediaItem);
      });
    } else {
      galleryDiv.innerHTML = '<p>Nenhuma mídia enviada ainda.</p>';
    }
  }

  function logout() {
    localStorage.removeItem(LOGIN_KEY);
    localStorage.removeItem(AUTH_PASS_KEY);
    showLogin();
  }

  function applyFiltersAndSort() {
    let filtered = allMediaList;
    if (currentSearch) {
      filtered = filtered.filter(media => media.caption.toLowerCase().includes(currentSearch));
    }
    // Ordenação
    filtered = filtered.slice(); // cópia
    if (currentSort === "date-desc") {
      filtered.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    } else if (currentSort === "date-asc") {
      filtered.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    } else if (currentSort === "title-asc") {
      filtered.sort((a, b) => (a.caption || "").localeCompare(b.caption || "", undefined, {sensitivity:'base'}));
    } else if (currentSort === "title-desc") {
      filtered.sort((a, b) => (b.caption || "").localeCompare(a.caption || "", undefined, {sensitivity:'base'}));
    }
    renderGallery(filtered);
  }


  // Filtro de busca por legenda
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      currentSearch = searchInput.value.toLowerCase();
      applyFiltersAndSort();
    });
  }

  // Ordenação
  const sortOptionSelect = document.getElementById('sortOption');
  if (sortOptionSelect) {
    sortOptionSelect.addEventListener('change', function() {
      currentSort = sortOptionSelect.value;
      applyFiltersAndSort();
    });
  }

  // Inicialização: garantir que ao carregar a galeria, filtros e ordenação sejam aplicados
  async function loadGallery() {
    if (!isAuthenticated()) {
      showLogin();
      return false;
    }
    galleryDiv.style.display = "block";
    galleryDiv.innerHTML = "<p>Carregando...</p>";
    try {
      const response = await fetch("/gallery", {
        headers: getAuthHeader()
      });
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          showLoginError();
        } else {
          galleryDiv.innerHTML = "<p>Erro ao carregar galeria.</p>";
        }
        return false;
      }
      const mediaList = await response.json();
      allMediaList = mediaList;
      applyFiltersAndSort();
      return true;
    } catch (_) {
      galleryDiv.innerHTML = "<p>Erro ao carregar galeria.</p>";
      return false;
    }
  }
// Handler para apagar mídia
document.addEventListener('click', async function(e) {
  if (e.target.classList.contains('delete-btn')) {
    const name = e.target.getAttribute('data-name');
    if (confirm('Tem certeza que deseja apagar esta mídia?')) {
      try {
        const response = await fetch(`/media/${encodeURIComponent(name)}`, {
          method: 'DELETE',
          headers: getAuthHeader()
        });
        if (response.ok) {
          loadGallery();
        } else {
          alert('Erro ao apagar mídia.');
        }
      } catch (err) {
        alert('Erro de conexão ao apagar.');
      }
    }
  }
});

// Abrir visualizador ao clicar na mídia (delegação)
document.addEventListener('click', function(e) {
  const item = e.target.closest('.media-item');
  if (item && !e.target.classList.contains('delete-btn')) {
    const idx = parseInt(item.getAttribute('data-index'), 10);
    if (!Number.isNaN(idx)) openViewer(idx);
  }
});

// Viewer logic
const viewerModal = document.getElementById('viewerModal');
const viewerMedia = document.getElementById('viewerMedia');
const viewerCaption = document.getElementById('viewerCaption');
const viewerDate = document.getElementById('viewerDate');
const viewerClose = document.getElementById('viewerClose');
const viewerPrev = document.getElementById('viewerPrev');
const viewerNext = document.getElementById('viewerNext');
const viewerFullscreen = document.getElementById('viewerFullscreen');
let currentViewerIndex = 0;

function openViewer(index) {
  const list = currentDisplayedList.length ? currentDisplayedList : allMediaList;
  if (!list || !list[index]) return;
  currentViewerIndex = index;
  showInViewer(list[currentViewerIndex]);
  viewerModal.style.display = 'flex';
  viewerModal.setAttribute('aria-hidden', 'false');
}

function closeViewer() {
  viewerModal.style.display = 'none';
  viewerModal.setAttribute('aria-hidden', 'true');
  viewerMedia.innerHTML = '';
}

function showInViewer(media) {
  viewerMedia.innerHTML = '';
  const ext = media.name.split('.').pop().toLowerCase();
  if (["mp4","webm","ogg"].includes(ext)) {
    const v = document.createElement('video');
    v.src = media.url;
    v.controls = true;
    v.autoplay = true;
    v.style.maxWidth = '100%';
    viewerMedia.appendChild(v);
  } else {
    const img = document.createElement('img');
    img.src = media.url;
    img.alt = media.caption || '';
    viewerMedia.appendChild(img);
  }
  viewerCaption.textContent = media.caption || '';
  viewerDate.textContent = media.date ? `📅 ${media.date}` : '';
}

viewerClose.addEventListener('click', closeViewer);
viewerPrev.addEventListener('click', function() {
  const list = currentDisplayedList.length ? currentDisplayedList : allMediaList;
  currentViewerIndex = (currentViewerIndex - 1 + list.length) % list.length;
  showInViewer(list[currentViewerIndex]);
});
viewerNext.addEventListener('click', function() {
  const list = currentDisplayedList.length ? currentDisplayedList : allMediaList;
  currentViewerIndex = (currentViewerIndex + 1) % list.length;
  showInViewer(list[currentViewerIndex]);
});

viewerFullscreen.addEventListener('click', function() {
  if (viewerModal.requestFullscreen) viewerModal.requestFullscreen();
  else if (viewerModal.webkitRequestFullscreen) viewerModal.webkitRequestFullscreen();
});

// Keyboard controls
document.addEventListener('keydown', function(e) {
  if (viewerModal.style.display !== 'none') {
    if (e.key === 'Escape') closeViewer();
    if (e.key === 'ArrowLeft') viewerPrev.click();
    if (e.key === 'ArrowRight') viewerNext.click();
  }
});

// Carregar galeria ao abrir a página
window.addEventListener("DOMContentLoaded", () => {
  if (isAuthenticated()) {
    hideLogin();
    loadGallery();
  } else {
    showLogin();
  }
});