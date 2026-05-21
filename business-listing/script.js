// script.js – Handles table rendering and detail modal for Business Listings

// Sample data – replace with real backend data as needed
const businesses = [
  {
    name: "GreenFields Agro Ltd",
    shortDesc: "Sustainable organic farming solutions for smallholders.",
    fullDesc: "GreenFields Agro Ltd provides end‑to‑end organic farming packages, including soil testing, certified seed supply, and market linkage for smallholder farmers across Sri Lanka. Our mission is to increase farm profitability while preserving the environment.",
    investmentRequired: 2500000,
    minInvestment: 500000,
    expectedReturn: "12% ROI within 18 months",
    industry: "Agriculture",
    stage: "Startup",
    location: { city: "Kandy", province: "Central" },
    contact: {
      person: "Nimal Perera",
      phone: "+94 71 234 5678",
      email: "nimal@greenfields.lk"
    },
    images: [
      "https://source.unsplash.com/featured/800x600?farm",
      "https://source.unsplash.com/featured/800x600?organic"
    ]
  },
  {
    name: "TechWave Solutions",
    shortDesc: "AI‑powered SaaS platform for retail inventory optimization.",
    fullDesc: "TechWave Solutions offers a cloud‑based AI engine that predicts demand, reduces stock‑outs, and minimizes waste for retail chains. The platform integrates with POS systems and provides real‑time dashboards for store managers.",
    investmentRequired: 8000000,
    minInvestment: 1000000,
    expectedReturn: "20% ROI within 24 months",
    industry: "Technology",
    stage: "Operating",
    location: { city: "Colombo", province: "Western" },
    contact: {
      person: "Samanthi Fernando",
      phone: "+94 77 456 1234",
      email: "samanthi@techwave.lk"
    },
    images: [
      "https://source.unsplash.com/featured/800x600?technology",
      "https://source.unsplash.com/featured/800x600?code"
    ]
  },
  {
    name: "EcoWear Textiles",
    shortDesc: "Sustainable garment manufacturing using organic cotton.",
    fullDesc: "EcoWear produces eco‑friendly apparel, employing fair‑trade practices and zero‑waste dyeing techniques. Serves boutique brands across South Asia.",
    investmentRequired: 15000000,
    minInvestment: 2000000,
    expectedReturn: "15% ROI in 2 years",
    industry: "Manufacturing",
    stage: "Idea",
    location: { city: "Galle", province: "Southern" },
    contact: {
      person: "Rashmi Fernando",
      phone: "+94 71 333 4444",
      email: "rashmi@ecowear.lk"
    },
    images: [
      "https://source.unsplash.com/featured/800x600?textile",
      "https://source.unsplash.com/featured/800x600?organic-clothing"
    ]
  },
  {
    name: "TasteBud Café",
    shortDesc: "Cozy café offering fusion Sri Lankan‑Asian menu.",
    fullDesc: "TasteBud Café blends local flavors with Asian street food concepts, providing a unique dining experience in Colombo’s bustling business district.",
    investmentRequired: 3500000,
    minInvestment: 500000,
    expectedReturn: "10% ROI within 18 months",
    industry: "Food & Beverage",
    stage: "Startup",
    location: { city: "Colombo", province: "Western" },
    contact: {
      person: "Lakshika Perera",
      phone: "+94 77 555 6666",
      email: "lakshika@tastebud.lk"
    },
    images: [
      "https://source.unsplash.com/featured/800x600?cafe",
      "https://source.unsplash.com/featured/800x600?food"
    ]
  }
];

// Utility to format numbers as LKR with commas
function formatLKR(num) {
  return "LKR " + num.toLocaleString("en-US");
}

function renderTable() {
  const tbody = document.getElementById("table-body");
  businesses.forEach((biz, idx) => {
    const tr = document.createElement("tr");
    tr.dataset.index = idx; // store index for click handler
    tr.innerHTML = `
      <td><a href="listing-detail.html?id=${idx}" class="name-link">${biz.name}</a></td>
      <td>${biz.shortDesc}</td>
      <td>${formatLKR(biz.investmentRequired)}</td>
      <td>${biz.industry}</td>
      <td>${biz.stage}</td>
      <td>${biz.location.city}${biz.location.province ? ", " + biz.location.province : ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

function openModal(biz) {
  const modal = document.getElementById("detail-modal");
  const body = document.getElementById("modal-body");
  // Build modal content
  const imagesHtml = biz.images.map(src => `<img src="${src}" alt="${biz.name} image" />`).join("");
  body.innerHTML = `
    <h2>${biz.name}</h2>
    <p><strong>Full Description:</strong> ${biz.fullDesc}</p>
    <p><strong>Investment Required:</strong> ${formatLKR(biz.investmentRequired)}</p>
    ${biz.minInvestment ? `<p><strong>Minimum Investment:</strong> ${formatLKR(biz.minInvestment)}</p>` : ""}
    ${biz.expectedReturn ? `<p><strong>Expected Return:</strong> ${biz.expectedReturn}</p>` : ""}
    <p><strong>Industry:</strong> ${biz.industry} | <strong>Stage:</strong> ${biz.stage}</p>
    <p><strong>Location:</strong> ${biz.location.city}${biz.location.province ? ", " + biz.location.province : ""}</p>
    <p><strong>Contact Person:</strong> ${biz.contact.person}</p>
    <p><strong>Phone:</strong> ${biz.contact.phone}</p>
    <p><strong>Email:</strong> <a href="mailto:${biz.contact.email}">${biz.contact.email}</a></p>
    <div class="modal-gallery">${imagesHtml}</div>
  `;
  modal.style.display = "flex";
}

function attachEvents() {
  const tbody = document.getElementById("table-body");
  tbody.addEventListener("click", e => {
    const row = e.target.closest("tr");
    if (!row) return;
    const idx = row.dataset.index;
    const biz = businesses[idx];
    openModal(biz);
  });

  const closeBtn = document.getElementById("modal-close");
  closeBtn.addEventListener("click", () => {
    document.getElementById("detail-modal").style.display = "none";
  });

  // Close modal on outside click
  window.addEventListener("click", e => {
    const modal = document.getElementById("detail-modal");
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
}

// Initialise UI
if (document.getElementById('table-body')) {
  renderTable();
  attachEvents();
}
