// blockchair-api.js - Batch processing

/**
 * Обработва адреси на части
 * @param {string} chain - blockchain
 * @param {Array<string>} addresses - Масив от адреси
 * @param {Function} processor - Функция за обработка
 * @param {number} batchSize - Размер на партидата
 * @returns {Promise<Array>} - Резултати
 */
async function batchProcessAddresses(chain, addresses, processor, batchSize = 100) {
    const results = [];
    const batches = [];
    
    for (let i = 0; i < addresses.length; i += batchSize) {
        batches.push(addresses.slice(i, i + batchSize));
    }
    
    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} addresses)`);
        
        try {
            const result = await processor(chain, batch);
            results.push(result);
        } catch (error) {
            console.error(`Batch ${i + 1} failed:`, error);
            // Продължаваме с следващата партида
        }
        
        // Забавяне между партидите
        if (i < batches.length - 1) {
            await sleep(1000);
        }
    }
    
    return results;
}

/**
 * Получава баланси на адреси на части
 * @param {string} chain - blockchain
 * @param {Array<string>} addresses - Масив от адреси
 * @param {number} batchSize - Размер на партидата
 * @returns {Promise<Object>} - Баланси
 */
async function batchGetBalances(chain, addresses, batchSize = 1000) {
    const results = await batchProcessAddresses(
        chain,
        addresses,
        async (chain, batch) => {
            return await getAddressBalances(chain, batch);
        },
        batchSize
    );
    
    // Обединяване на резултатите
    const combined = { data: {}, context: { results: 0 } };
    for (const result of results) {
        if (result && result.data) {
            Object.assign(combined.data, result.data);
            combined.context.results += Object.keys(result.data).length;
        }
    }
    
    return combined;
}