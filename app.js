// Data model for listings
class ListingStore {
  constructor() {
    this.listingsKey = 'hela_listings';
    this.initSeedData();
  }

  // Seed data if empty
  initSeedData() {
    if (!localStorage.getItem(this.listingsKey)) {
      const seedData = [
        {
          id: '1',
          businessName: 'Ceylon Organic Farms',
          shortDescription: 'Export-oriented organic farm seeking expansion capital.',
          fullDescription: 'We are a certified organic farm producing spices and coconut products for European markets. We need investment to upgrade our processing facility.',
          investmentRequired: 15000000,
          minimumInvestment: 5000000,
          industry: 'Agriculture',
          businessStage: 'Expansion',
          district: 'Kurunegala',
          contactName: 'Nimal Perera',
          phone: '0771234567',
          email: 'nimal@ceylonorganic.lk',
          status: 'published',
          images: []
        },
        {
          id: '2',
          businessName: 'TechHub Colombo',
          shortDescription: 'SaaS startup providing HR solutions for SMEs.',
          fullDescription: 'Growing SaaS platform with 50+ active B2B clients. Raising seed round for marketing and adding AI features.',
          investmentRequired: 25000000,
          minimumInvestment: 10000000,
          industry: 'Technology',
          businessStage: 'Startup',
          district: 'Colombo',
          contactName: 'Sarah Silva',
          phone: '0719876543',
          email: 'sarah@techhub.lk',
          status: 'published',
          images: []
        },
        {
          id: '3',
          businessName: 'Lanka Heritage Stays',
          shortDescription: 'Boutique hotel chain in southern coast.',
          fullDescription: 'Operating 3 boutique properties. Looking for a partner to acquire a new beachfront property in Mirissa.',
          investmentRequired: 50000000,
          minimumInvestment: 50000000,
          industry: 'Hotels & Resorts',
          businessStage: 'Operating',
          district: 'Galle',
          contactName: 'Ruwan de Silva',
          phone: '0765554433',
          email: 'ruwan@heritage.lk',
          status: 'published',
          images: []
        }
      ];
      localStorage.setItem(this.listingsKey, JSON.stringify(seedData));
    }
  }

  getAll() {
    return JSON.parse(localStorage.getItem(this.listingsKey)) || [];
  }

  getPublished() {
    return this.getAll().filter(l => l.status === 'published');
  }

  getById(id) {
    return this.getAll().find(l => l.id === id);
  }

  save(listing) {
    const listings = this.getAll();
    listing.id = listing.id || Date.now().toString();
    listing.status = listing.status || 'pending';
    listing.submittedAt = new Date().toISOString();
    listings.push(listing);
    localStorage.setItem(this.listingsKey, JSON.stringify(listings));
    return listing;
  }

  update(id, updates) {
    let listings = this.getAll();
    const index = listings.findIndex(l => l.id === id);
    if (index !== -1) {
      listings[index] = { ...listings[index], ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem(this.listingsKey, JSON.stringify(listings));
    }
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(amount);
  }
}

const store = new ListingStore();

// Utility for formatting LKR in UI
function formatLKR(amount) {
  return store.formatCurrency(amount);
}

// ----------------------------------------------------------------------------
// Authentication Store
// ----------------------------------------------------------------------------
class AuthStore {
  constructor() {
    this.usersKey = 'hela_users';
    this.sessionKey = 'hela_session';
  }

  getUsers() {
    return JSON.parse(localStorage.getItem(this.usersKey)) || [];
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem(this.sessionKey)) || null;
  }

  register(name, email, password, role) {
    const users = this.getUsers();
    if (users.find(u => u.email === email)) {
      throw new Error("Email already registered");
    }
    const newUser = { id: Date.now().toString(), name, email, password, role };
    users.push(newUser);
    localStorage.setItem(this.usersKey, JSON.stringify(users));
    return newUser;
  }

  login(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new Error("Invalid credentials");
    }
    localStorage.setItem(this.sessionKey, JSON.stringify(user));
    return user;
  }

  loginWithGoogle() {
    // Mock Google SSO User
    const user = {
      id: 'g_' + Date.now().toString(),
      name: 'Google User',
      email: 'user@gmail.com',
      role: 'client' // Default role for SSO mock
    };
    // Ensure mock user is in db
    const users = this.getUsers();
    if (!users.find(u => u.email === user.email)) {
      users.push(user);
      localStorage.setItem(this.usersKey, JSON.stringify(users));
    }
    localStorage.setItem(this.sessionKey, JSON.stringify(user));
    return user;
  }

  logout() {
    localStorage.removeItem(this.sessionKey);
  }
}

const authStore = new AuthStore();

// ----------------------------------------------------------------------------
// Shared Global UI Logic
// ----------------------------------------------------------------------------

function updateGlobalAuthUI() {
  const user = authStore.getCurrentUser();
  const topAuth = document.getElementById('topbar-auth');
  const headerAuth = document.getElementById('header-auth');
  
  if (user) {
      const roleLabel = user.role === 'publisher' ? '(Publisher)' : '(Client)';
      const loggedInHTML = `
          <span style="color:#003399; font-weight:700; font-size:0.8rem; margin-right:10px;">
              Hi, ${user.name.split(' ')[0]} ${roleLabel}
          </span>
          <a href="#" onclick="logoutUser(event)" class="tj-btn-text" style="color:#cc0000; padding:0; text-decoration:none; font-size:0.8rem;">Logout</a>
      `;
      if (topAuth) topAuth.innerHTML = loggedInHTML;
      if (headerAuth) headerAuth.innerHTML = loggedInHTML;
  } else {
      const loggedOutHTML = `<a href="auth.html" class="tj-btn-login">Log In / Sign Up</a>`;
      const topLoggedOutHTML = `<a href="auth.html" class="tj-btn-login" style="font-size:0.78rem;">Log In / Sign Up</a>`;
      if (topAuth) topAuth.innerHTML = topLoggedOutHTML;
      if (headerAuth) headerAuth.innerHTML = loggedOutHTML;
  }
}

function logoutUser(e) {
  if (e) e.preventDefault();
  authStore.logout();
  window.location.href = 'index.html';
}

function handlePostListing(e) {
  if (e) e.preventDefault();
  const user = authStore.getCurrentUser();
  if (!user) {
      alert("You must be logged in to post a listing.");
      window.location.href = 'auth.html';
      return;
  }
  if (user.role !== 'publisher') {
      alert("Only Job Publishers can post listings. You are registered as a Normal Client.");
      return;
  }
  window.location.href = 'submit.html';
}

// Auto-run UI sync on DOM load if elements exist
document.addEventListener('DOMContentLoaded', () => {
  updateGlobalAuthUI();
});

// ----------------------------------------------------------------------------
// Category Store (For Dynamic Service Categories)
// ----------------------------------------------------------------------------
class CategoryStore {
  constructor() {
    this.categoriesKey = 'hela_categories';
    this.initSeedData();
  }

  initSeedData() {
    if (!localStorage.getItem(this.categoriesKey)) {
      const seedData = [
        { id: '1', name: 'IT & Software', active: true },
        { id: '2', name: 'Finance, Accounting & Audit', active: false },
        { id: '3', name: 'Banking & Insurance', active: false },
        { id: '4', name: 'Sales, Marketing & Business Dev.', active: false },
        { id: '5', name: 'HR, Training & Recruitment', active: false },
        { id: '6', name: 'Corporate Management / Strategy', active: false },
        { id: '7', name: 'Office Admin & Secretarial', active: false },
        { id: '8', name: 'Technical, Engineering & Industrial', active: false },
        { id: '9', name: 'Hospitality, Tourism & Logistics', active: false },
        { id: '10', name: 'Medical, Nursing & Legal', active: false }
      ];
      localStorage.setItem(this.categoriesKey, JSON.stringify(seedData));
    }
  }

  getAll() {
    return JSON.parse(localStorage.getItem(this.categoriesKey)) || [];
  }

  save(name) {
    const categories = this.getAll();
    categories.push({ id: Date.now().toString(), name, active: false });
    localStorage.setItem(this.categoriesKey, JSON.stringify(categories));
  }

  delete(id) {
    let categories = this.getAll();
    categories = categories.filter(c => c.id !== id);
    localStorage.setItem(this.categoriesKey, JSON.stringify(categories));
  }
}

const categoryStore = new CategoryStore();

// ----------------------------------------------------------------------------
// Settings Store (For Dynamic Site Content)
// ----------------------------------------------------------------------------
class SettingsStore {
  constructor() {
    this.settingsKey = 'hela_settings';
    this.initSeedData();
  }

  initSeedData() {
    if (!localStorage.getItem(this.settingsKey)) {
      const defaultSettings = {
        adRates: 'LKR 6,400 per vacancy. Duration: 14 days.\nInternational clients: USD 35 per vacancy (includes bank charges).\nSignificant discount for more than 2 vacancies.',
        adRules: 'Vacancy art work can be of unlimited size, full color.\nTerms and Conditions will be applied.',
        paymentInstructions: 'We accept cash/cheque deposits, bank transfer, credit card payment (visa/mastercard) and other convenient methods.\n\nOnce the payment is made, Please send the scanned copy/photo of the deposited slip via email. For payments using fund transfer, You can send the screenshot of the receipt.'
      };
      localStorage.setItem(this.settingsKey, JSON.stringify(defaultSettings));
    }
  }

  getSettings() {
    return JSON.parse(localStorage.getItem(this.settingsKey));
  }

  updateSettings(newSettings) {
    localStorage.setItem(this.settingsKey, JSON.stringify(newSettings));
  }
}

const settingsStore = new SettingsStore();

