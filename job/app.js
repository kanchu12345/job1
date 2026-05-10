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
