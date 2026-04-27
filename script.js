const modal = document.getElementById("uploadModal");
const closeBtn = document.getElementsByClassName("close")[0];

closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

modal.addEventListener("click", (event) => {
  if (event.target == modal) {
    modal.style.display = "none";
  }
});

const openBtn = document.getElementById("uploadBtn");

openBtn.addEventListener("click", () => {
  modal.style.display = "block";
});

const form = document.getElementById("uploadForm");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const media = document.getElementById("media").files[0];
  const caption = document.getElementById("caption").value;
  const password = document.getElementById("password").value;

  if (!media || !caption || !password) {
    alert("Preencha todos os campos.");
    return;
  }

  const formData = new FormData();
  formData.append("media", media);
  formData.append("caption", caption);
  formData.append("password", password);

  try {
    const response = await fetch("http://localhost:3000/upload", {
      method: "POST",
      body: formData
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

// Função para carregar a galeria
async function loadGallery() {
  const galleryDiv = document.querySelector(".gallery") || document.getElementById("gallery");
  if (!galleryDiv) return;
  galleryDiv.innerHTML = "<p>Carregando...</p>";
  try {
    const response = await fetch("http://localhost:3000/gallery");
    const mediaList = await response.json();
    if (Array.isArray(mediaList) && mediaList.length > 0) {
      galleryDiv.innerHTML = mediaList.map(media => {
        const ext = media.name.split('.').pop().toLowerCase();
        if (["mp4", "webm", "ogg"].includes(ext)) {
          return `<div class='media-item'><video src="http://localhost:3000${media.url}" controls width="320"></video><p>${media.caption}</p></div>`;
        } else {
          return `<div class='media-item'><img src="http://localhost:3000${media.url}" alt="${media.caption}" width="320"/><p>${media.caption}</p></div>`;
        }
      }).join("");
    } else {
      galleryDiv.innerHTML = "<p>Nenhuma mídia enviada ainda.</p>";
    }
  } catch (err) {
    galleryDiv.innerHTML = "<p>Erro ao carregar galeria.</p>";
  }
}

// Carregar galeria ao abrir a página
window.addEventListener("DOMContentLoaded", loadGallery);