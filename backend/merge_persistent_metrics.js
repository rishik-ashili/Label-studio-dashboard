import fs from 'fs/promises';
import path from 'path';

/**
 * Merge historical persistent_metrics data from src/storage/cache into storage/cache
 * This ensures the backfill has access to all historical data
 */

const HISTORICAL_FILE = './src/storage/cache/persistent_metrics.json';
const CURRENT_FILE = './storage/cache/persistent_metrics.json';

async function mergeMetrics() {
    try {
        console.log('📊 Merging persistent metrics data...\n');

        // Read both files
        const historicalData = JSON.parse(await fs.readFile(HISTORICAL_FILE, 'utf-8'));
        const currentData = JSON.parse(await fs.readFile(CURRENT_FILE, 'utf-8'));

        const mergedData = { ...currentData };

        // Merge histories for each project
        for (const [projectId, projectData] of Object.entries(historicalData)) {
            if (!mergedData[projectId]) {
                // Project doesn't exist in current, add it completely
                mergedData[projectId] = projectData;
                console.log(`✅ Added project ${projectId} with ${projectData.history?.length || 0} historical entries`);
            } else {
                // Project exists, merge histories
                const currentHistory = mergedData[projectId].history || [];
                const historicalHistory = projectData.history || [];

                // Combine histories and remove duplicates by timestamp
                const allEntries = [...historicalHistory, ...currentHistory];
                const uniqueMap = new Map();

                allEntries.forEach(entry => {
                    uniqueMap.set(entry.timestamp, entry);
                });

                // Sort by timestamp ascending
                const mergedHistory = Array.from(uniqueMap.values())
                    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

                mergedData[projectId].history = mergedHistory;

                const historicalCount = historicalHistory.length;
                const currentCount = currentHistory.length;
                const mergedCount = mergedHistory.length;
                const addedCount = mergedCount - currentCount;

                console.log(`🔄 Project ${projectId}: ${historicalCount} historical + ${currentCount} current = ${mergedCount} total (${addedCount} new entries)`);
            }
        }

        // Save merged data
        await fs.writeFile(CURRENT_FILE, JSON.stringify(mergedData, null, 2), 'utf-8');

        console.log('\n✨ Merge complete! Merged data saved to:', CURRENT_FILE);

        // Print summary
        const totalProjects = Object.keys(mergedData).length;
        const totalEntries = Object.values(mergedData).reduce((sum, proj) => sum + (proj.history?.length || 0), 0);

        console.log(`\n📈 Summary:`);
        console.log(`   Total projects: ${totalProjects}`);
        console.log(`   Total history entries: ${totalEntries}`);

        // Get date range
        const allTimestamps = [];
        Object.values(mergedData).forEach(proj => {
            (proj.history || []).forEach(entry => {
                allTimestamps.push(entry.timestamp.split('T')[0]);
            });
        });

        const uniqueDates = [...new Set(allTimestamps)].sort();
        if (uniqueDates.length > 0) {
            console.log(`   Date range: ${uniqueDates[0]} to ${uniqueDates[uniqueDates.length - 1]}`);
            console.log(`   Unique dates: ${uniqueDates.length}`);
        }

        console.log('\n🚀 Now you can run the backfill endpoint again to populate time-series data!');

    } catch (error) {
        console.error('❌ Error merging metrics:', error);
        process.exit(1);
    }
}

mergeMetrics();
