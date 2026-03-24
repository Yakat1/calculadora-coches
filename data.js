// data.js - Base de datos y configuración en memoria

// Catálogo de Productos
const products = [
    { id: 'p1', name: 'Champú Automotriz Premium', unit: 'ml', cost: 350, content: 1000 },
    { id: 'p2', name: 'Desengrasante APC', unit: 'ml', cost: 200, content: 3780 },
    { id: 'p3', name: 'Cera de Carnauba', unit: 'gr', cost: 800, content: 250 },
    { id: 'p4', name: 'Recubrimiento Cerámico (9H)', unit: 'ml', cost: 1500, content: 50 },
    { id: 'p5', name: 'Limpiador de Interiores', unit: 'ml', cost: 250, content: 500 },
    { id: 'p6', name: 'Acondicionador de Plásticos', unit: 'ml', cost: 300, content: 400 },
    { id: 'p7', name: 'Pad de Pulido (Corte)', unit: 'pieza', cost: 250, content: 1 },
    { id: 'p8', name: 'Pad de Pulido (Acabado)', unit: 'pieza', cost: 250, content: 1 },
    { id: 'p9', name: 'Pulimento Compuesto', unit: 'ml', cost: 600, content: 500 }
];

// Categorías de Vehículos y Multiplicadores de Área
// Base 1.0 = Sedán Mediano (~8 m² de superficie pintable)
// Factores calculados proporcionalmente al área exterior estimada
const vehicleCategories = [
    // --- Compactos y City Cars ---
    { id: 'v01', type: 'City Car / Micro',          factor: 0.60, icon: '🚗' },  // ~4.8 m² (Ej: Smart, Fiat 500, Suzuki Ignis)
    { id: 'v02', type: 'Hatchback Pequeño',         factor: 0.75, icon: '🚗' },  // ~6.0 m² (Ej: March, i10, Spark)
    { id: 'v03', type: 'Hatchback Mediano',          factor: 0.85, icon: '🚗' },  // ~6.8 m² (Ej: Mazda 3 HB, Golf, Civic HB)

    // --- Sedanes ---
    { id: 'v04', type: 'Sedán Subcompacto',         factor: 0.80, icon: '🚘' },  // ~6.4 m² (Ej: Versa, Vento, Accent)
    { id: 'v05', type: 'Sedán Mediano',              factor: 1.00, icon: '🚘' },  // ~8.0 m² (Ej: Civic, Mazda 3, Corolla) ⭐ BASE
    { id: 'v06', type: 'Sedán Grande / Full-Size',   factor: 1.15, icon: '🚘' },  // ~9.2 m² (Ej: Camry, Accord, Mazda 6)
    { id: 'v07', type: 'Sedán Premium / Luxury',     factor: 1.25, icon: '🚘' },  // ~10 m² (Ej: BMW Serie 5, Mercedes Clase E, Audi A6)

    // --- Coupés y Deportivos ---
    { id: 'v08', type: 'Coupé / Deportivo',          factor: 0.85, icon: '🏎️' }, // ~6.8 m² (Ej: BRZ, Mustang, 86)
    { id: 'v09', type: 'Convertible',                factor: 0.80, icon: '🏎️' }, // ~6.4 m² (Ej: Miata, Z4) - Sin techo rígido
    { id: 'v10', type: 'Superdeportivo / Exótico',   factor: 0.90, icon: '🏎️' }, // ~7.2 m² (Ej: Corvette, 911, Ferrari)

    // --- Crossovers y SUVs ---
    { id: 'v11', type: 'Crossover / SUV Mini',       factor: 1.10, icon: '🚙' },  // ~8.8 m² (Ej: HR-V, CX-30, Kicks)
    { id: 'v12', type: 'SUV Compacta',               factor: 1.25, icon: '🚙' },  // ~10 m² (Ej: RAV4, CX-5, Tucson, CR-V)
    { id: 'v13', type: 'SUV Mediana (3 filas)',       factor: 1.45, icon: '🚙' },  // ~11.6 m² (Ej: Pilot, CX-9, Palisade)
    { id: 'v14', type: 'SUV Grande / Full-Size',      factor: 1.70, icon: '🚙' },  // ~13.6 m² (Ej: Tahoe, Expedition, Armada)
    { id: 'v15', type: 'SUV XL / Extendida',         factor: 2.00, icon: '🚙' },  // ~16 m² (Ej: Suburban, Expedition MAX, Escalade ESV)

    // --- Pickups ---
    { id: 'v16', type: 'Pickup Compacta',            factor: 1.20, icon: '🛻' },  // ~9.6 m² (Ej: Maverick, Stacks, NP300 Chasis)
    { id: 'v17', type: 'Pickup Mediana (Doble Cab)',  factor: 1.45, icon: '🛻' },  // ~11.6 m² (Ej: Frontier, Tacoma, Ranger, Hilux)
    { id: 'v18', type: 'Pickup Full-Size',            factor: 1.75, icon: '🛻' },  // ~14 m² (Ej: Ram 1500, F-150, Silverado, Tundra)
    { id: 'v19', type: 'Pickup HD / Heavy Duty',      factor: 2.10, icon: '🛻' },  // ~16.8 m² (Ej: Ram 2500/3500, F-250, Sierra HD)

    // --- Wagons y Familiares ---
    { id: 'v20', type: 'Station Wagon / Familiar',   factor: 1.10, icon: '🚕' },  // ~8.8 m² (Ej: Outback, V60, Alltrack)

    // --- Vans y Minivans ---
    { id: 'v21', type: 'Minivan',                    factor: 1.50, icon: '🚐' },  // ~12 m² (Ej: Odyssey, Sienna, Carnival)
    { id: 'v22', type: 'Van Pasajeros / Comercial',  factor: 1.85, icon: '🚐' },  // ~14.8 m² (Ej: Transit, Sprinter, Hiace)
    { id: 'v23', type: 'Van XL / Extendida',         factor: 2.20, icon: '🚐' },  // ~17.6 m² (Ej: Sprinter LWB, Transit Extended)

    // --- Especiales ---
    { id: 'v24', type: 'Camión Ligero / Chasis',     factor: 2.40, icon: '🚚' },  // ~19.2 m² (Ej: NPR, F-450 Chasis, 3.5t)
];

// Servicios Disponibles
const services = [
    {
        id: 's1',
        name: 'Lavado Exterior y Descontaminado',
        baseTimeMinutes: 60,
        productsRequired: [
            { productId: 'p1', baseUse: 40 }, // 40ml para Sedan Promedio
            { productId: 'p2', baseUse: 100 }
        ]
    },
    {
        id: 's2',
        name: 'Detallado Interior Profundo',
        baseTimeMinutes: 120,
        productsRequired: [
            { productId: 'p5', baseUse: 150 },
            { productId: 'p6', baseUse: 80 }
        ]
    },
    {
        id: 's3',
        name: 'Encerado Premium (Carnauba)',
        baseTimeMinutes: 60,
        productsRequired: [
            { productId: 'p3', baseUse: 25 } // 25gr
        ]
    },
    {
        id: 's4',
        name: 'Pulido Básico + Recubrimiento Cerámico',
        baseTimeMinutes: 360,
        productsRequired: [
            { productId: 'p9', baseUse: 80 },
            { productId: 'p7', baseUse: 0.5 }, 
            { productId: 'p8', baseUse: 0.5 },
            { productId: 'p4', baseUse: 25 }
        ]
    }
];

// Configuración del Taller (Modificable)
let shopConfig = {
    hourlyRate: 250, // Tarifa por hora en Moneda Local
    targetMargin: 0.40 // 40% de margen de ganancia
};
