// calculator.js - Funciones matemáticas e interacciones de negocio

function getProductCostPerUnit(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    return product.cost / product.content;
}

function calculateMaterialCost(selectedServices, vehicleFactor, manualItems = []) {
    let totalMaterialCost = 0;
    const materialsBreakdown = [];

    // Base estimated product uses
    selectedServices.forEach(serviceId => {
        const service = services.find(s => s.id === serviceId);
        if (!service) return;

        // Interior services scale at 60% because cabin volume grows slower than exterior area
        const isInterior = service.name.toLowerCase().includes('interior');
        const effectiveFactor = isInterior ? 1 + (vehicleFactor - 1) * 0.6 : vehicleFactor;

        service.productsRequired.forEach(req => {
            const product = products.find(p => p.id === req.productId);
            const costPerUnit = getProductCostPerUnit(req.productId);
            const estimatedAmount = req.baseUse * effectiveFactor;
            const cost = costPerUnit * estimatedAmount;
            
            totalMaterialCost += cost;
            
            // Guardar para desglose
            const existing = materialsBreakdown.find(m => m.id === req.productId);
            if(existing) {
                 existing.amount += estimatedAmount;
                 existing.cost += cost;
            } else {
                 materialsBreakdown.push({
                     id: product.id,
                     name: product.name,
                     unit: product.unit,
                     amount: estimatedAmount,
                     cost: cost
                 });
            }
        });
    });

    // Añadir componentes manuales exactos
    manualItems.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const costPerUnit = getProductCostPerUnit(item.productId);
            const cost = costPerUnit * item.amount;
            totalMaterialCost += cost;
            
            const existing = materialsBreakdown.find(m => m.id === item.productId);
            if(existing) {
                 existing.amount += item.amount;
                 existing.cost += cost;
            } else {
                 materialsBreakdown.push({
                     id: product.id,
                     name: product.name,
                     unit: product.unit,
                     amount: item.amount,
                     cost: cost,
                     isManual: true
                 });
            }
        }
    });

    return { total: totalMaterialCost, breakdown: materialsBreakdown };
}

function calculateLaborCost(selectedServices, vehicleFactor) {
    let totalMinutes = 0;
    
    selectedServices.forEach(serviceId => {
        const service = services.find(s => s.id === serviceId);
        if (service) {
            totalMinutes += service.baseTimeMinutes * vehicleFactor;
        }
    });

    const hours = totalMinutes / 60;
    const laborCost = hours * shopConfig.hourlyRate;
    
    return { total: laborCost, timeHours: hours };
}

function generateQuote(selectedVehicleId, selectedServicesIds, manualItems = []) {
    const vehicle = vehicleCategories.find(v => v.id === selectedVehicleId);
    if (!vehicle) throw new Error("Vehículo no seleccionado");

    const materialCalc = calculateMaterialCost(selectedServicesIds, vehicle.factor, manualItems);
    const laborCalc = calculateLaborCost(selectedServicesIds, vehicle.factor);
    const costTotal = materialCalc.total + laborCalc.total;
    
    // Calcula Precio Sugerido sumando el Margen al Costo Total
    const marginRatio = shopConfig.targetMargin;
    const marginAmount = costTotal * marginRatio;
    const priceWithMargin = costTotal + marginAmount;

    return {
        vehicleType: vehicle.type,
        factor: vehicle.factor,
        materials: materialCalc,
        labor: laborCalc,
        totalCost: costTotal,
        suggestedPrice: priceWithMargin,
        marginAmount: marginAmount
    };
}
