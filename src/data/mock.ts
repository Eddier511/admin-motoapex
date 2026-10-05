import type { Brand, Category, Motorcycle, Lead, Promotion, User } from '../types';

export const mockBrands: Brand[] = [
  { id: 'b1', name: 'Ducati', slug: 'ducati', primaryColor: '#CC0000', secondaryColor: '#8B0000', description: 'Italian excellence in motorcycling', status: 'active', order: 1, logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop' },
  { id: 'b2', name: 'KTM', slug: 'ktm', primaryColor: '#FF6600', secondaryColor: '#1a1a1a', description: 'Ready to Race', status: 'active', order: 2, logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop' },
  { id: 'b3', name: 'Husqvarna', slug: 'husqvarna', primaryColor: '#1B3A6B', secondaryColor: '#E8E8E8', description: 'Swedish precision motorcycle manufacturing', status: 'active', order: 3 },
  { id: 'b4', name: 'GASGAS', slug: 'gasgas', primaryColor: '#E30613', secondaryColor: '#1a1a1a', description: 'Let\'s Go', status: 'active', order: 4 },
];

export const mockCategories: Category[] = [
  { id: 'c1', name: 'Superbike', slug: 'superbike', description: 'High-performance track-ready bikes', order: 1, status: 'active' },
  { id: 'c2', name: 'Naked', slug: 'naked', description: 'Aggressive street fighters', order: 2, status: 'active' },
  { id: 'c3', name: 'Adventure', slug: 'adventure', description: 'On and off-road explorers', order: 3, status: 'active' },
  { id: 'c4', name: 'Enduro', slug: 'enduro', description: 'Off-road competition bikes', order: 4, status: 'active' },
  { id: 'c5', name: 'Cross', slug: 'cross', description: 'Motocross racing machines', order: 5, status: 'active' },
  { id: 'c6', name: 'Trial', slug: 'trial', description: 'Precision trial bikes', order: 6, status: 'active' },
];

export const mockMotorcycles: Motorcycle[] = [
  {
    id: 'm1', brand: 'Ducati', brandId: 'b1', model: 'Panigale V4', version: 'S', year: 2025,
    category: 'Superbike', categoryId: 'c1', displacement: 1103, price: 38500000, currency: 'CRC',
    sku: 'DUC-PV4S-25', status: 'available', published: true, featured: true, isNew: true,
    showPrice: true, allowQuote: true, shortDescription: 'La superbike italiana más avanzada del mercado.',
    description: 'La Panigale V4 S combina aerodinámica de carreras con tecnología de última generación.',
    colors: [
      { id: 'col1', name: 'Ducati Red', hex: '#CC0000', status: 'active', available: true, order: 1,
        images: [
          { id: 'img1', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop', label: 'Vista frontal', alt: 'Ducati Panigale V4 S roja vista frontal', order: 1, isPrimary: true },
          { id: 'img2', url: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&h=600&fit=crop', label: 'Vista lateral', alt: 'Ducati Panigale V4 S roja vista lateral', order: 2, isPrimary: false },
        ]
      },
      { id: 'col2', name: 'Winter Test', hex: '#F5F5F5', status: 'active', available: false, order: 2, images: [] },
    ],
    inventory: 2, createdAt: '2025-01-15', updatedAt: '2025-11-20', slug: 'ducati-panigale-v4-s-2025',
  },
  {
    id: 'm2', brand: 'KTM', brandId: 'b2', model: '390 Duke', version: '', year: 2025,
    category: 'Naked', categoryId: 'c2', displacement: 399, price: 7800000, currency: 'CRC',
    sku: 'KTM-390D-25', status: 'available', published: true, featured: false, isNew: true,
    showPrice: true, allowQuote: true, shortDescription: 'La naked urbana más vendida de KTM.',
    description: 'Con su motor monocilíndrico de 399cc, la KTM 390 Duke ofrece rendimiento puro para la ciudad.',
    colors: [
      { id: 'col3', name: 'Electronic Orange', hex: '#F97316', status: 'active', available: true, order: 1,
        images: [
          { id: 'img3', url: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&h=600&fit=crop', label: 'Vista frontal', alt: 'KTM 390 Duke naranja vista frontal', order: 1, isPrimary: true },
        ]
      },
      { id: 'col4', name: 'Black Storm', hex: '#1a1a1a', status: 'active', available: true, order: 2, images: [] },
    ],
    inventory: 5, createdAt: '2025-02-01', updatedAt: '2025-11-18', slug: 'ktm-390-duke-2025',
  },
  {
    id: 'm3', brand: 'Husqvarna', brandId: 'b3', model: 'Norden 901', version: 'Expedition', year: 2025,
    category: 'Adventure', categoryId: 'c3', displacement: 889, price: 21500000, currency: 'CRC',
    sku: 'HUS-N901E-25', status: 'coming_soon', published: false, featured: false, isNew: true,
    showPrice: true, allowQuote: true, shortDescription: 'Adventure touring de alto nivel.',
    description: 'La Norden 901 Expedition está diseñada para los exploradores más exigentes.',
    colors: [], inventory: 0, createdAt: '2025-03-10', updatedAt: '2025-11-10', slug: 'husqvarna-norden-901-expedition-2025',
  },
  {
    id: 'm4', brand: 'KTM', brandId: 'b2', model: '1290 Super Duke R', version: 'EVO', year: 2025,
    category: 'Naked', categoryId: 'c2', displacement: 1301, price: 29900000, currency: 'CRC',
    sku: 'KTM-1290R-25', status: 'reserved', published: true, featured: true, isNew: false,
    showPrice: true, allowQuote: false, shortDescription: 'La bestia naranja definitiva.',
    description: 'Potencia sin compromisos. La 1290 Super Duke R EVO redefine el concepto de naked.',
    colors: [
      { id: 'col5', name: 'Electronic Orange', hex: '#F97316', status: 'active', available: true, order: 1, images: [] },
    ],
    inventory: 1, createdAt: '2024-11-05', updatedAt: '2025-11-22', slug: 'ktm-1290-super-duke-r-evo-2025',
  },
  {
    id: 'm5', brand: 'GASGAS', brandId: 'b4', model: 'EC 300', version: '', year: 2025,
    category: 'Enduro', categoryId: 'c4', displacement: 293, price: 9200000, currency: 'CRC',
    sku: 'GAS-EC300-25', status: 'available', published: true, featured: false, isNew: false,
    showPrice: true, allowQuote: true, shortDescription: 'Enduro de 2 tiempos para competición.',
    description: 'La EC 300 de GASGAS es una máquina de enduro diseñada para la competición.',
    colors: [], inventory: 3, createdAt: '2025-01-20', updatedAt: '2025-10-15', slug: 'gasgas-ec-300-2025',
  },
];

export const mockLeads: Lead[] = [
  { id: 'l1', date: '2025-11-23', name: 'Andrés Vargas', phone: '+506 8888-1111', email: 'andres@email.com', brand: 'Ducati', motorcycle: 'Panigale V4 S', type: 'quote', status: 'new', message: 'Me interesa conocer el precio con financiamiento.' },
  { id: 'l2', date: '2025-11-22', name: 'María Solano', phone: '+506 7777-2222', email: 'maria@email.com', brand: 'KTM', motorcycle: '390 Duke', type: 'test_ride', status: 'contacted', assignedTo: 'Carlos V.', message: 'Quiero probar la moto antes de comprarla.' },
  { id: 'l3', date: '2025-11-21', name: 'Luis Mora', phone: '+506 6666-3333', email: 'luis@email.com', brand: 'KTM', motorcycle: '1290 Super Duke R', type: 'availability', status: 'follow_up', message: '¿Cuándo llega el modelo EVO?' },
  { id: 'l4', date: '2025-11-20', name: 'Carlos Jiménez', phone: '+506 5555-4444', email: 'carlos@email.com', brand: 'Husqvarna', motorcycle: 'Norden 901', type: 'whatsapp', status: 'new' },
  { id: 'l5', date: '2025-11-19', name: 'Sofia Brenes', phone: '+506 4444-5555', email: 'sofia@email.com', brand: 'GASGAS', motorcycle: 'EC 300', type: 'contact', status: 'closed', assignedTo: 'María R.' },
  { id: 'l6', date: '2025-11-18', name: 'Diego Castro', phone: '+506 3333-6666', email: 'diego@email.com', brand: 'Ducati', motorcycle: 'Monster 937', type: 'quote', status: 'discarded' },
];

export const mockPromotions: Promotion[] = [
  { id: 'pr1', title: 'Ducati Fin de Año', description: 'Aprovecha el precio especial en la Panigale V4.', brand: 'Ducati', model: 'Panigale V4', originalPrice: 38500000, promoPrice: 35000000, startDate: '2025-11-01', endDate: '2025-12-31', status: 'active', featured: true, showOnHome: true },
  { id: 'pr2', title: 'KTM Orange Days', description: 'Las mejores motos KTM con precio de lanzamiento.', brand: 'KTM', model: '390 Duke', originalPrice: 7800000, promoPrice: 7200000, startDate: '2025-11-15', endDate: '2025-12-15', status: 'active', featured: false, showOnHome: true },
  { id: 'pr3', title: 'Husqvarna Adventure Pack', description: 'Norden 901 con accesorios incluidos.', brand: 'Husqvarna', model: 'Norden 901', originalPrice: 21500000, promoPrice: 20000000, startDate: '2025-10-01', endDate: '2025-10-31', status: 'expired', featured: false, showOnHome: false },
];

export const mockUsers: User[] = [
  { id: 'u1', name: 'Eddier Ramírez', email: 'eddier@motoapexcr.com', role: 'admin', status: 'active', lastAccess: '2025-11-23 10:45' },
  { id: 'u2', name: 'Carlos Vega', email: 'carlos@motoapexcr.com', role: 'sales', status: 'active', lastAccess: '2025-11-23 09:30' },
  { id: 'u3', name: 'María Rodríguez', email: 'maria@motoapexcr.com', role: 'marketing', status: 'active', lastAccess: '2025-11-22 16:00' },
  { id: 'u4', name: 'Jorge Alvarado', email: 'jorge@motoapexcr.com', role: 'editor', status: 'inactive', lastAccess: '2025-11-10 11:00' },
];

export const leadsChartData = [
  { month: 'May', leads: 12 }, { month: 'Jun', leads: 19 }, { month: 'Jul', leads: 15 },
  { month: 'Ago', leads: 28 }, { month: 'Sep', leads: 22 }, { month: 'Oct', leads: 31 },
  { month: 'Nov', leads: 24 },
];

export const brandConsultations = [
  { brand: 'KTM', value: 42 }, { brand: 'Ducati', value: 31 }, { brand: 'Husqvarna', value: 16 }, { brand: 'GASGAS', value: 11 },
];

export const topMotorcycles = [
  { name: 'KTM 390 Duke', views: 284 }, { name: 'Ducati Panigale V4 S', views: 218 },
  { name: 'KTM 1290 SDR', views: 176 }, { name: 'Husqvarna Norden 901', views: 142 }, { name: 'GASGAS EC 300', views: 98 },
];

export const recentActivity = [
  { id: 1, action: 'Moto publicada', detail: 'KTM 390 Duke 2025', user: 'Eddier R.', time: 'hace 15 min', type: 'publish' },
  { id: 2, action: 'Precio modificado', detail: 'Ducati Panigale V4 S', user: 'Carlos V.', time: 'hace 1 hora', type: 'price' },
  { id: 3, action: 'Lead recibido', detail: 'Andrés Vargas — Cotización', user: 'Sistema', time: 'hace 2 horas', type: 'lead' },
  { id: 4, action: 'Imagen agregada', detail: 'KTM 1290 Super Duke R', user: 'María R.', time: 'hace 3 horas', type: 'image' },
  { id: 5, action: 'Inventario actualizado', detail: 'GASGAS EC 300 → 3 unidades', user: 'Eddier R.', time: 'hace 5 horas', type: 'inventory' },
  { id: 6, action: 'Promoción creada', detail: 'KTM Orange Days', user: 'María R.', time: 'hace 1 día', type: 'promo' },
];
