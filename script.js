
// --- Autenticação simples ---
const LOGIN_KEY = "autenticado";
const LOGIN_PASS = "robiju";

const loginModal = document.getElementById("loginModal");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const galleryDiv = document.getElementById("gallery");

function isAuthenticated() {
  return localStorage.getItem(LOGIN_KEY) === "true";
}
function showLogin() {
  loginModal.style.display = "block";
  galleryDiv.style.display = "none";
}

function hideLogin() {
  loginModal.style.display = "none";
  galleryDiv.style.display = "block";
}

function logout() {
  localStorage.removeItem(LOGIN_KEY);
  showLogin();
}

loginForm.addEventListener("submit", function(e) {
  e.preventDefault();
  const pass = document.getElementById("loginPassword").value;
  if (pass === LOGIN_PASS) {
    localStorage.setItem(LOGIN_KEY, "true");
    loginError.style.display = "none";
    hideLogin();
    loadGallery();
  } else {
    loginError.style.display = "block";
    loginError.textContent = "Não é essa bobinha! É o nosso apelido carinhoso, você sabe!";
  }
});

// --- Modal de upload ---
const modal = document.getElementById("uploadModal");
const closeBtn = document.getElementsByClassName("close")[0];
closeBtn.addEventListener("click", () => { modal.style.display = "none"; });
modal.addEventListener("click", (event) => { if (event.target == modal) { modal.style.display = "none"; } });
const openBtn = document.getElementById("uploadBtn");
openBtn.addEventListener("click", () => {
  if (!isAuthenticated()) { showLogin(); return; }
  modal.style.display = "block";
});

const form = document.getElementById("uploadForm");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!isAuthenticated()) { showLogin(); return; }
  const media = document.getElementById("media").files[0];
  const caption = document.getElementById("caption").value;
  const date = document.getElementById("date").value;
  if (!media || !caption) {
    alert("Preencha todos os campos.");
    return;
  }
  const formData = new FormData();
  formData.append("media", media);
  formData.append("caption", caption);
  if (date) formData.append("date", date);
  try {
    const response = await fetch("http://localhost:3000/upload", {
      method: "POST",
      body: formData,
      headers: { Authorization: `Bearer ${LOGIN_PASS}` }
    });
    const result = await response.json();
    if (response.ok) {
      alert("Upload realizado com sucesso!");
      form.reset();
      modal.style.display = "none";
      loadGallery();
    } else {
      alert(result.error || "Erro ao enviar mídia.");
    }
  } catch (err) {
    alert("Erro de conexão com o servidor.");
  }
});


let allMediaList = [];
let currentDisplayedList = [];
let currentSearch = "";
let currentSort = "date-desc";


  function renderGallery(mediaList) {
    if (Array.isArray(mediaList) && mediaList.length > 0) {
      // marcar lista atual exibida e renderizar com índice
      currentDisplayedList = mediaList;
      galleryDiv.innerHTML = mediaList.map((media, idx) => {
        const ext = media.name.split('.').pop().toLowerCase();
        const mediaContent = (["mp4", "webm", "ogg"].includes(ext))
          ? `<video src=\"http://localhost:3000${media.url}\" controls width=\"320\"></video>`
          : `<img src=\"http://localhost:3000${media.url}\" alt=\"${media.caption}\" width=\"320\"/>`;
        let dateHtml = "";
        if (media.date) {
          dateHtml = `<span class='media-date' style='display:block;color:#888;font-size:0.95em;margin-bottom:4px;'>📅 ${media.date}</span>`;
        }
        return `<div class='media-item' data-index='${idx}'>` +
               `<span class=\"media-title\" style=\"display:none\">${media.caption}</span>` +
               `${mediaContent}${dateHtml}<p>${media.caption}</p><button class='delete-btn' data-name='${media.name}'>🗑️ Apagar</button></div>`;
      }).join("");
    } else {
      galleryDiv.innerHTML = "<p>Nenhuma mídia enviada ainda.</p>";
    }
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
  function loadGallery() {
    if (!isAuthenticated()) {
      showLogin();
      return;
    }
    galleryDiv.style.display = "block";
    galleryDiv.innerHTML = "<p>Carregando...</p>";
    fetch("http://localhost:3000/gallery", {
      headers: { Authorization: `Bearer ${LOGIN_PASS}` }
    })
      .then(response => response.json())
      .then(mediaList => {
        allMediaList = mediaList;
        applyFiltersAndSort();
      })
      .catch(() => {
        galleryDiv.innerHTML = "<p>Erro ao carregar galeria.</p>";
      });
  }
// Handler para apagar mídia
document.addEventListener('click', async function(e) {
  if (e.target.classList.contains('delete-btn')) {
    const name = e.target.getAttribute('data-name');
    if (confirm('Tem certeza que deseja apagar esta mídia?')) {
      try {
        const response = await fetch(`http://localhost:3000/media/${encodeURIComponent(name)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${LOGIN_PASS}` }
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
    v.src = `http://localhost:3000${media.url}`;
    v.controls = true;
    v.autoplay = true;
    v.style.maxWidth = '100%';
    viewerMedia.appendChild(v);
  } else {
    const img = document.createElement('img');
    img.src = `http://localhost:3000${media.url}`;
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