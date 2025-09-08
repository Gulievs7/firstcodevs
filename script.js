fetch('app.json')
  .then(res => res.json())
  .then(data => {
    const gallery = document.getElementById("gallery");

    data.images.forEach(item => {
      const card = document.createElement("div");
      card.classList.add("image-card");

      card.innerHTML = `
        <img src="${item.url}" alt="${item.title}">
        <div class="overlay">${item.name}</div>
        <div class="image-info">
          <span> ${item.date}</span>
          <span> ${item.views}</span>
        </div>
      `;

      gallery.appendChild(card);
    });
  })
  .catch(err => console.error("JSON yüklənmədi:", err));
